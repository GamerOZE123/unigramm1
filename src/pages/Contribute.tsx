import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader2,
  Code, Palette, Megaphone, Sparkles, User, Rocket, Upload, X, FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logoImg from '@/assets/unigramm-logo.png';

const roles = [
  { value: 'developer', label: 'Developer', icon: Code, description: 'Frontend, backend, mobile' },
  { value: 'designer', label: 'Designer', icon: Palette, description: 'UI/UX, branding, graphics' },
  { value: 'marketing', label: 'Marketing', icon: Megaphone, description: 'Social media, growth, content' },
  { value: 'other', label: 'Other', icon: Sparkles, description: 'Specify your own' },
];

const pageVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 80 : -80, opacity: 0, scale: 0.97 }),
};

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const inputStyle = {
  background: 'rgba(79,142,255,0.06)',
  border: '1px solid rgba(79,142,255,0.15)',
  color: '#fff',
};

export default function Contribute() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savingStep1, setSavingStep1] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    full_name: '', email: '', skills: '', message: '', portfolio_url: '',
    custom_role: '', experience: '', experience_links: '', university: '',
    year_of_study: '', availability: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const canProceed = formData.full_name.trim() && formData.email.trim();
  const canSubmit = selectedRole && (selectedRole !== 'other' || formData.custom_role.trim());

  const goNext = async () => {
    if (!canProceed) return;
    setSavingStep1(true);
    try {
      const { data, error } = await supabase
        .from('contributor_applications')
        .insert({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          skills: formData.skills.trim() || null,
          experience: formData.experience.trim() || null,
          experience_links: formData.experience_links.trim() || null,
          university: formData.university.trim() || null,
          year_of_study: formData.year_of_study.trim() || null,
        })
        .select('id')
        .single();

      if (error) {
        if (error.code !== '23505') {
          toast.error('Something went wrong. Please try again.');
          setSavingStep1(false);
          return;
        }
      } else if (data) {
        setSavedId(data.id);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
      setSavingStep1(false);
      return;
    }
    setSavingStep1(false);
    setDirection(1);
    setStep(1);
  };

  const goBack = () => { setDirection(-1); setStep(0); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const updateData = {
        role: selectedRole,
        custom_role: selectedRole === 'other' ? formData.custom_role.trim() || null : null,
        message: formData.message.trim() || null,
        portfolio_url: formData.portfolio_url.trim() || null,
        availability: formData.availability.trim() || null,
      };

      let error;
      if (savedId) {
        ({ error } = await supabase.from('contributor_applications').update(updateData).eq('id', savedId));
      } else {
        ({ error } = await supabase.from('contributor_applications').update(updateData).eq('email', formData.email.trim().toLowerCase()));
      }

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
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: '#080c17', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="max-w-sm text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(74,222,128,0.1)' }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#4ade80' }} />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>
            You're in!
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Thanks for wanting to be part of Unigramm. We'll review your application and reach out soon.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <button onClick={() => navigate('/')} className="h-10 px-5 rounded-xl text-sm font-medium flex items-center gap-2 mx-auto transition-all hover:bg-[#4f8eff]/10"
              style={{ border: '1px solid rgba(79,142,255,0.35)', color: '#4f8eff' }}>
              <ArrowLeft className="w-4 h-4" /> Back to home
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#080c17', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(8,12,23,0.8)', borderColor: 'rgba(79,142,255,0.08)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between" style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)' }}>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="Unigramm" className="h-6 sm:h-7" />
          </button>
          <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 hover:bg-[#4f8eff]/10"
            style={{ border: '1px solid rgba(79,142,255,0.35)', color: '#4f8eff' }}>
            <ArrowLeft className="w-3 h-3 inline mr-1.5" />Back
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-5">
        <div className="max-w-lg mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[
              { label: 'About you', icon: User },
              { label: 'Towards Unigramm', icon: Rocket },
            ].map((s, i) => (
              <button key={i} type="button"
                onClick={() => { if (i === 0) goBack(); if (i === 1 && canProceed) goNext(); }}
                className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: step === i ? '#4f8eff' : 'rgba(79,142,255,0.1)' }}>
                  <s.icon className="w-3.5 h-3.5" style={{ color: step === i ? '#080c17' : 'rgba(255,255,255,0.4)' }} />
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${step === i ? 'text-white' : ''}`}
                  style={step !== i ? { color: 'rgba(255,255,255,0.4)' } : undefined}>
                  {s.label}
                </span>
                {i === 0 && <div className="w-12 h-px mx-1" style={{ background: 'rgba(79,142,255,0.15)' }} />}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-10 overflow-hidden" style={{ background: 'rgba(79,142,255,0.1)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)' }}
              animate={{ width: step === 0 ? '50%' : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
          </div>

          {/* Animated pages */}
          <form onSubmit={handleSubmit}>
            <div className="relative overflow-hidden min-h-[500px]">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 0 && (
                  <motion.div key="step-0" custom={direction} variants={pageVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} className="space-y-5">

                    <motion.div className="text-center mb-8" variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                        Tell us about yourself
                      </h1>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>We'd love to know who you are</p>
                    </motion.div>

                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
                      <div className="space-y-1.5">
                        <Label htmlFor="full_name" className="text-sm text-white/70">Full name *</Label>
                        <input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange}
                          required placeholder="Your name" className="w-full h-11 px-4 rounded-xl text-sm outline-none" style={inputStyle} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm text-white/70">Email *</Label>
                        <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                          required placeholder="you@example.com" className="w-full h-11 px-4 rounded-xl text-sm outline-none" style={inputStyle} />
                      </div>
                    </motion.div>

                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={fieldVariants} initial="hidden" animate="visible" custom={2}>
                      <div className="space-y-1.5">
                        <Label htmlFor="university" className="text-sm text-white/70">University</Label>
                        <input id="university" name="university" value={formData.university} onChange={handleChange}
                          placeholder="Your university" className="w-full h-11 px-4 rounded-xl text-sm outline-none" style={inputStyle} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="year_of_study" className="text-sm text-white/70">Year of study</Label>
                        <input id="year_of_study" name="year_of_study" value={formData.year_of_study} onChange={handleChange}
                          placeholder="e.g. 2nd year, Graduate..." className="w-full h-11 px-4 rounded-xl text-sm outline-none" style={inputStyle} />
                      </div>
                    </motion.div>

                    <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={3}>
                      <Label htmlFor="skills" className="text-sm text-white/70">Skills / Tech stack</Label>
                      <input id="skills" name="skills" value={formData.skills} onChange={handleChange}
                        placeholder="e.g. React, Figma, Python, Premiere Pro..." className="w-full h-11 px-4 rounded-xl text-sm outline-none" style={inputStyle} />
                    </motion.div>

                    <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={4}>
                      <Label htmlFor="experience" className="text-sm text-white/70">Any prior experience?</Label>
                      <textarea id="experience" name="experience" value={formData.experience} onChange={handleChange}
                        placeholder="Projects, internships, freelance work, or anything relevant..." rows={3}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                    </motion.div>

                    <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={5}>
                      <Label htmlFor="experience_links" className="text-sm text-white/70">Links to your work</Label>
                      <textarea id="experience_links" name="experience_links" value={formData.experience_links} onChange={handleChange}
                        placeholder={"Portfolio, GitHub, Behance, Dribbble, LinkedIn...\nhttps://github.com/yourname"} rows={2}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                    </motion.div>

                    <motion.div variants={fieldVariants} initial="hidden" animate="visible" custom={6} className="pt-2">
                      <button type="button" onClick={goNext} disabled={!canProceed || savingStep1}
                        className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)', color: '#080c17' }}>
                        {savingStep1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </motion.div>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div key="step-1" custom={direction} variants={pageVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} className="space-y-5">

                    <motion.div className="text-center mb-8" variants={fieldVariants} initial="hidden" animate="visible" custom={0}>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                        Towards Unigramm
                      </h1>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>How would you like to be part of what we're building?</p>
                    </motion.div>

                    <motion.div className="space-y-2" variants={fieldVariants} initial="hidden" animate="visible" custom={1}>
                      <Label className="text-sm font-medium text-white/70">How would you like to contribute?</Label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {roles.map((role) => (
                          <motion.button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200"
                            style={{
                              background: selectedRole === role.value ? 'rgba(79,142,255,0.12)' : 'rgba(79,142,255,0.04)',
                              border: `1px solid ${selectedRole === role.value ? 'rgba(79,142,255,0.4)' : 'rgba(79,142,255,0.1)'}`,
                            }}>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: selectedRole === role.value ? 'rgba(79,142,255,0.2)' : 'rgba(79,142,255,0.08)' }}>
                              <role.icon className="w-4 h-4" style={{ color: selectedRole === role.value ? '#4f8eff' : 'rgba(255,255,255,0.4)' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">{role.label}</p>
                              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{role.description}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>

                    <AnimatePresence>
                      {selectedRole === 'other' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="space-y-1.5">
                            <Label htmlFor="custom_role" className="text-sm text-white/70">What field or role do you have in mind? *</Label>
                            <input id="custom_role" name="custom_role" value={formData.custom_role} onChange={handleChange}
                              placeholder="e.g. Community manager, Content writer, Video editor..."
                              className="w-full h-11 px-4 rounded-xl text-sm outline-none" style={inputStyle} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={2}>
                      <Label htmlFor="availability" className="text-sm text-white/70">How many hours per week can you dedicate?</Label>
                      <input id="availability" name="availability" value={formData.availability} onChange={handleChange}
                        placeholder="e.g. 5-10 hours, weekends only..."
                        className="w-full h-11 px-4 rounded-xl text-sm outline-none" style={inputStyle} />
                    </motion.div>

                    <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={3}>
                      <Label htmlFor="portfolio_url" className="text-sm text-white/70">Portfolio / LinkedIn / GitHub</Label>
                      <input id="portfolio_url" name="portfolio_url" type="url" value={formData.portfolio_url} onChange={handleChange}
                        placeholder="https://..."
                        className="w-full h-11 px-4 rounded-xl text-sm outline-none" style={inputStyle} />
                    </motion.div>

                    <motion.div className="space-y-1.5" variants={fieldVariants} initial="hidden" animate="visible" custom={4}>
                      <Label htmlFor="message" className="text-sm text-white/70">How would you like to contribute to being a part of Unigramm?</Label>
                      <textarea id="message" name="message" value={formData.message} onChange={handleChange}
                        placeholder="What excites you about Unigramm? What ideas do you have?" rows={4}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                    </motion.div>

                    <motion.div className="flex gap-3 pt-2" variants={fieldVariants} initial="hidden" animate="visible" custom={5}>
                      <button type="button" onClick={goBack}
                        className="h-12 px-5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all hover:bg-[#4f8eff]/10"
                        style={{ border: '1px solid rgba(79,142,255,0.35)', color: '#4f8eff' }}>
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button type="submit" disabled={loading || !canSubmit}
                        className="flex-1 h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)', color: '#080c17' }}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit application <ArrowRight className="w-4 h-4" /></>}
                      </button>
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
