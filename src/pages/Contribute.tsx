import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, ArrowLeft, ArrowRight, CheckCircle, Loader2,
  Code, Palette, Megaphone, Sparkles, User, Rocket
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const roles = [
  { value: 'developer', label: 'Developer', icon: Code, description: 'Frontend, backend, mobile' },
  { value: 'designer', label: 'Designer', icon: Palette, description: 'UI/UX, branding, graphics' },
  { value: 'marketing', label: 'Marketing', icon: Megaphone, description: 'Social media, growth, content' },
  { value: 'other', label: 'Other', icon: Sparkles, description: 'Specify your own' },
];

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    scale: 0.97,
  }),
};

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function Contribute() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0); // 0 = about you, 1 = towards unigramm
  const [direction, setDirection] = useState(1);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savingStep1, setSavingStep1] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    skills: '',
    message: '',
    portfolio_url: '',
    custom_role: '',
    experience: '',
    experience_links: '',
    university: '',
    year_of_study: '',
    availability: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const canProceed = formData.full_name.trim() && formData.email.trim();
  const canSubmit = selectedRole && (selectedRole !== 'other' || formData.custom_role.trim());

  const goNext = () => {
    if (!canProceed) return;
    setDirection(1);
    setStep(1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contributor_applications')
        .insert({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: selectedRole,
          custom_role: selectedRole === 'other' ? formData.custom_role.trim() || null : null,
          skills: formData.skills.trim() || null,
          message: formData.message.trim() || null,
          portfolio_url: formData.portfolio_url.trim() || null,
          experience: formData.experience.trim() || null,
          experience_links: formData.experience_links.trim() || null,
          university: formData.university.trim() || null,
          year_of_study: formData.year_of_study.trim() || null,
          availability: formData.availability.trim() || null,
        });

      if (error) {
        toast.error('Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
        toast.success("Application submitted! We'll reach out soon.");
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-success" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-2xl font-bold mb-2"
          >
            You're in!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-muted-foreground text-sm mb-8"
          >
            Thanks for wanting to be part of Unigramm. We'll review your application and reach out soon.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">Unigramm</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
        </div>
      </nav>

      <div className="pt-20 pb-16 px-5">
        <div className="max-w-lg mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[
              { label: 'About you', icon: User },
              { label: 'Towards Unigramm', icon: Rocket },
            ].map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (i === 0) goBack();
                  if (i === 1 && canProceed) goNext();
                }}
                className="flex items-center gap-2 group"
              >
                <motion.div
                  animate={{
                    scale: step === i ? 1 : 0.9,
                    backgroundColor: step === i ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                >
                  <s.icon className={`w-3.5 h-3.5 ${step === i ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </motion.div>
                <span className={`text-xs font-medium hidden sm:inline transition-colors ${
                  step === i ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {s.label}
                </span>
                {i === 0 && (
                  <div className="w-12 h-px bg-border mx-1" />
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-muted rounded-full mb-10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'hsl(var(--primary))' }}
              animate={{ width: step === 0 ? '50%' : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Animated pages */}
          <form onSubmit={handleSubmit}>
            <div className="relative overflow-hidden min-h-[500px]">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    custom={direction}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="space-y-5"
                  >
                    <motion.div
                      className="text-center mb-8"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                    >
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                        Tell us about yourself
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        We'd love to know who you are
                      </p>
                    </motion.div>

                    {/* Name & Email */}
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={1}
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="full_name" className="text-sm">Full name *</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                          placeholder="Your name"
                          className="bg-card/60 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="you@example.com"
                          className="bg-card/60 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                        />
                      </div>
                    </motion.div>

                    {/* University & Year */}
                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={2}
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="university" className="text-sm">University</Label>
                        <Input
                          id="university"
                          name="university"
                          value={formData.university}
                          onChange={handleChange}
                          placeholder="Your university"
                          className="bg-card/60 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="year_of_study" className="text-sm">Year of study</Label>
                        <Input
                          id="year_of_study"
                          name="year_of_study"
                          value={formData.year_of_study}
                          onChange={handleChange}
                          placeholder="e.g. 2nd year, Graduate..."
                          className="bg-card/60 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                        />
                      </div>
                    </motion.div>

                    {/* Skills */}
                    <motion.div
                      className="space-y-1.5"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={3}
                    >
                      <Label htmlFor="skills" className="text-sm">Skills / Tech stack</Label>
                      <Input
                        id="skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        placeholder="e.g. React, Figma, Python, Premiere Pro..."
                        className="bg-card/60 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                      />
                    </motion.div>

                    {/* Experience */}
                    <motion.div
                      className="space-y-1.5"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={4}
                    >
                      <Label htmlFor="experience" className="text-sm">Any prior experience?</Label>
                      <Textarea
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleChange}
                        placeholder="Projects, internships, freelance work, or anything relevant..."
                        rows={3}
                        className="bg-card/60 border-border/50 resize-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                      />
                    </motion.div>

                    {/* Experience links */}
                    <motion.div
                      className="space-y-1.5"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={5}
                    >
                      <Label htmlFor="experience_links" className="text-sm">Links to your work</Label>
                      <Textarea
                        id="experience_links"
                        name="experience_links"
                        value={formData.experience_links}
                        onChange={handleChange}
                        placeholder={"Portfolio, GitHub, Behance, Dribbble, LinkedIn...\nhttps://github.com/yourname"}
                        rows={2}
                        className="bg-card/60 border-border/50 resize-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                      />
                    </motion.div>

                    {/* Next button */}
                    <motion.div
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={6}
                      className="pt-2"
                    >
                      <Button
                        type="button"
                        size="lg"
                        onClick={goNext}
                        disabled={!canProceed}
                        className="btn-primary w-full h-12 text-sm group"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={pageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="space-y-5"
                  >
                    <motion.div
                      className="text-center mb-8"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                    >
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                        Towards Unigramm
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        How would you like to be part of what we're building?
                      </p>
                    </motion.div>

                    {/* Role selection */}
                    <motion.div
                      className="space-y-2"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={1}
                    >
                      <Label className="text-sm font-medium">How would you like to contribute?</Label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {roles.map((role) => (
                          <motion.button
                            key={role.value}
                            type="button"
                            onClick={() => setSelectedRole(role.value)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                              selectedRole === role.value
                                ? 'border-primary bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_20px_-4px_hsl(var(--primary)/0.2)]'
                                : 'border-border/50 bg-card/40 hover:border-border hover:bg-card/70'
                            }`}
                          >
                            <motion.div
                              animate={{
                                backgroundColor: selectedRole === role.value
                                  ? 'hsl(var(--primary) / 0.2)'
                                  : 'hsl(var(--muted))',
                                rotate: selectedRole === role.value ? [0, -8, 8, 0] : 0,
                              }}
                              transition={{ duration: 0.4 }}
                              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            >
                              <role.icon className={`w-4 h-4 ${selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'}`} />
                            </motion.div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{role.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Custom role */}
                    <AnimatePresence>
                      {selectedRole === 'other' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1.5">
                            <Label htmlFor="custom_role" className="text-sm">What field or role do you have in mind? *</Label>
                            <Input
                              id="custom_role"
                              name="custom_role"
                              value={formData.custom_role}
                              onChange={handleChange}
                              placeholder="e.g. Community manager, Content writer, Video editor..."
                              className="bg-card/60 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Availability */}
                    <motion.div
                      className="space-y-1.5"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={2}
                    >
                      <Label htmlFor="availability" className="text-sm">How many hours per week can you dedicate?</Label>
                      <Input
                        id="availability"
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        placeholder="e.g. 5-10 hours, weekends only..."
                        className="bg-card/60 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                      />
                    </motion.div>

                    {/* Portfolio */}
                    <motion.div
                      className="space-y-1.5"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={3}
                    >
                      <Label htmlFor="portfolio_url" className="text-sm">Portfolio / LinkedIn / GitHub</Label>
                      <Input
                        id="portfolio_url"
                        name="portfolio_url"
                        type="url"
                        value={formData.portfolio_url}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="bg-card/60 border-border/50 h-11 transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                      />
                    </motion.div>

                    {/* Message */}
                    <motion.div
                      className="space-y-1.5"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={4}
                    >
                      <Label htmlFor="message" className="text-sm">How would you like to contribute to being a part of Unigramm?</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="What excites you about Unigramm? What ideas do you have? How do you see yourself contributing?"
                        rows={4}
                        className="bg-card/60 border-border/50 resize-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]"
                      />
                    </motion.div>

                    {/* Buttons */}
                    <motion.div
                      className="flex gap-3 pt-2"
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      custom={5}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={goBack}
                        className="h-12 px-5 text-sm"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={loading || !canSubmit}
                        className="btn-primary flex-1 h-12 text-sm group"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Submit application
                            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
