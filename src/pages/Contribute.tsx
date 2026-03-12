import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, ArrowLeft, CheckCircle, Loader2,
  Code, Palette, Megaphone, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const roles = [
  { value: 'developer', label: 'Developer', icon: Code, description: 'Frontend, backend, mobile' },
  { value: 'designer', label: 'Designer', icon: Palette, description: 'UI/UX, branding, graphics' },
  { value: 'marketing', label: 'Marketing', icon: Megaphone, description: 'Social media, growth, content' },
  { value: 'other', label: 'Other', icon: Sparkles, description: 'Specify your own' },
];

export default function Contribute() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !formData.full_name.trim() || !formData.email.trim()) return;

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Application received!</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Thanks for wanting to be part of Unigramm. We'll review your application and get back to you soon.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Button>
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

      <div className="pt-24 pb-16 px-5">
        <motion.div
          className="max-w-lg mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Be part of Unigramm
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              We're building something special for students everywhere. Tell us about yourself and how you'd like to contribute.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">How would you like to contribute?</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                      selectedRole === role.value
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border/50 bg-card/40 hover:border-border hover:bg-card/70'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      selectedRole === role.value ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <role.icon className={`w-4 h-4 ${selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{role.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom role field for "Other" */}
            <AnimatePresence>
              {selectedRole === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <Label htmlFor="custom_role" className="text-sm">What field or role do you have in mind? *</Label>
                  <Input
                    id="custom_role"
                    name="custom_role"
                    value={formData.custom_role}
                    onChange={handleChange}
                    required={selectedRole === 'other'}
                    placeholder="e.g. Community manager, Content writer, Video editor..."
                    className="bg-card/60 border-border/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* About you section */}
            <div className="space-y-1 pt-2">
              <h3 className="text-sm font-semibold text-foreground">About you</h3>
              <p className="text-xs text-muted-foreground">Help us get to know you better</p>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-sm">Full name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="bg-card/60 border-border/50"
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
                  className="bg-card/60 border-border/50"
                />
              </div>
            </div>

            {/* University & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="university" className="text-sm">University</Label>
                <Input
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="Your university"
                  className="bg-card/60 border-border/50"
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
                  className="bg-card/60 border-border/50"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <Label htmlFor="skills" className="text-sm">Skills / Tech stack</Label>
              <Input
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. React, Figma, Python, Premiere Pro..."
                className="bg-card/60 border-border/50"
              />
            </div>

            {/* Experience section */}
            <div className="space-y-1 pt-2">
              <h3 className="text-sm font-semibold text-foreground">Experience</h3>
              <p className="text-xs text-muted-foreground">Share any relevant prior experience</p>
            </div>

            {/* Prior experience */}
            <div className="space-y-1.5">
              <Label htmlFor="experience" className="text-sm">Do you have any prior experience in this area?</Label>
              <Textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Tell us about relevant projects, internships, or anything you've worked on..."
                rows={3}
                className="bg-card/60 border-border/50 resize-none"
              />
            </div>

            {/* Experience links / portfolio */}
            <div className="space-y-1.5">
              <Label htmlFor="experience_links" className="text-sm">Links to your work (portfolio, GitHub, Behance, etc.)</Label>
              <Textarea
                id="experience_links"
                name="experience_links"
                value={formData.experience_links}
                onChange={handleChange}
                placeholder={"Paste links to your portfolio, past projects, designs, code repos...\ne.g.\nhttps://github.com/yourname\nhttps://dribbble.com/yourname"}
                rows={3}
                className="bg-card/60 border-border/50 resize-none"
              />
            </div>

            {/* Availability */}
            <div className="space-y-1.5">
              <Label htmlFor="availability" className="text-sm">How many hours per week can you dedicate?</Label>
              <Input
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                placeholder="e.g. 5-10 hours, weekends only..."
                className="bg-card/60 border-border/50"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-sm">How would you like to contribute to being a part of Unigramm?</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="What excites you about Unigramm? What ideas do you have? How do you see yourself contributing?"
                rows={4}
                className="bg-card/60 border-border/50 resize-none"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || !selectedRole || !formData.full_name || !formData.email || (selectedRole === 'other' && !formData.custom_role)}
              className="btn-primary w-full h-12 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Submit application'
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
