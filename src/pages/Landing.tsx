import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, MessageCircle, Users, Briefcase, Heart,
  TrendingUp, Shield, ArrowRight, CheckCircle, Loader2, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const words = ['connect', 'discover', 'grow', 'belong'];

const features = [
  { icon: MessageCircle, title: 'Chat', description: 'Talk in real-time', accent: '209 99% 65%' },
  { icon: Users, title: 'Clubs', description: 'Find your people', accent: '142 71% 45%' },
  { icon: Briefcase, title: 'Jobs', description: 'Campus gigs', accent: '38 92% 50%' },
  { icon: Heart, title: 'Dating', description: 'Meet someone', accent: '340 75% 55%' },
  { icon: TrendingUp, title: 'Startups', description: 'Build stuff', accent: '270 70% 60%' },
  { icon: Shield, title: 'Confessions', description: 'Stay anon', accent: '200 80% 50%' },
];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % words.length), 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative h-[1.15em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block text-transparent bg-clip-text university-gradient"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function FeatureChip({ icon: Icon, title, accent, index }: { icon: React.ElementType; title: string; accent: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/30 bg-card/40 backdrop-blur-sm select-none"
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `hsl(${accent} / 0.12)` }}
      >
        <Icon className="w-3 h-3" style={{ color: `hsl(${accent})` }} />
      </div>
      <span className="text-xs font-medium text-foreground/80">{title}</span>
    </motion.div>
  );
}

function FloatingCard({ icon: Icon, title, description, accent, index }: { icon: React.ElementType; title: string; description: string; accent: string; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className="group cursor-default"
    >
      <div className="relative p-4 rounded-2xl border border-border/20 bg-card/25 backdrop-blur-md hover:border-border/40 hover:bg-card/50 transition-all duration-500">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
          style={{ background: `hsl(${accent} / 0.1)` }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: `hsl(${accent})` }} />
        </div>
        <p className="text-[13px] font-semibold text-foreground mb-0.5">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
      </div>
    </motion.div>
  );
}

function EarlyAccessForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('early_access_signups')
        .insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === '23505') {
          toast.info("You're already on the list!");
          setSubmitted(true);
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      } else {
        setSubmitted(true);
        toast.success("You're in! We'll let you know when Unigramm launches.");
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[hsl(142_71%_45%/0.08)] border border-[hsl(142_71%_45%/0.15)]"
      >
        <CheckCircle className="w-4 h-4 shrink-0 text-[hsl(142,71%,45%)]" />
        <span className="text-sm font-medium text-foreground/80">You're on the list!</span>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 h-11 bg-card/30 border-border/30 placeholder:text-muted-foreground/40 rounded-xl text-sm focus:border-primary/40"
      />
      <Button
        type="submit"
        disabled={loading}
        className="btn-primary text-sm px-4 sm:px-5 h-11 shrink-0 rounded-xl group whitespace-nowrap"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span className="hidden sm:inline">Get access</span>
            <span className="sm:hidden">Join</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </Button>
    </form>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(209 99% 65% / 0.06) 0%, transparent 70%)',
            top: '5%',
            right: '-15%',
          }}
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(270 70% 60% / 0.04) 0%, transparent 70%)',
            bottom: '10%',
            left: '-10%',
          }}
          animate={{ x: [0, -15, 0], y: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/15">
        <div className="max-w-5xl mx-auto px-4 h-12 sm:h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="text-[15px] font-bold tracking-tight text-foreground">Unigramm</span>
          </div>
          <button
            onClick={() => navigate('/contribute')}
            className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground/70 hover:text-foreground transition-colors duration-200 group"
          >
            <Sparkles className="w-3 h-3 text-primary/50 group-hover:text-primary transition-colors" />
            <span>Join the team</span>
          </button>
        </div>
      </nav>

      {/* Hero — Mobile-first */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center px-5 pt-16 pb-8">
        <div className="max-w-5xl mx-auto w-full relative z-10">
          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 sm:mb-10"
          >
            <motion.div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/30 bg-card/20 text-[11px] text-muted-foreground/70 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="w-1 h-1 rounded-full bg-[hsl(var(--warning))] animate-pulse" />
              Coming soon
            </motion.div>

            <h1 className="text-[2rem] sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-3">
              Where students
              <br />
              <RotatingWord />
            </h1>

            <p className="text-[13px] sm:text-sm text-muted-foreground/70 max-w-xs sm:max-w-sm mb-6 leading-relaxed">
              Chat, clubs, jobs, dating & more — your entire campus in one app.
            </p>

            <div className="max-w-sm">
              <EarlyAccessForm />
            </div>
          </motion.div>

          {/* Feature chips on mobile, 3D cards on desktop */}
          {/* Mobile: horizontal scroll chips */}
          <div className="lg:hidden">
            <motion.div
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {features.map((f, i) => (
                <FeatureChip key={f.title} icon={f.icon} title={f.title} accent={f.accent} index={i} />
              ))}
            </motion.div>
          </div>

          {/* Desktop: 3D tilt cards */}
          <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[380px]" style={{ perspective: 800 }}>
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <FloatingCard key={f.title} icon={f.icon} title={f.title} description={f.description} accent={f.accent} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint — hidden on mobile to save space */}
        <motion.div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden sm:block"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="w-4 h-7 rounded-full border border-border/25 flex items-start justify-center pt-1.5">
            <div className="w-0.5 h-1.5 rounded-full bg-muted-foreground/25" />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/15 py-5 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground/50">© {new Date().getFullYear()} Unigramm</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/support" className="text-[11px] text-muted-foreground/40 hover:text-foreground/70 transition-colors">Support</a>
            <a href="/privacy-policy" className="text-[11px] text-muted-foreground/40 hover:text-foreground/70 transition-colors">Privacy</a>
            <button
              onClick={() => navigate('/contribute')}
              className="text-[11px] text-muted-foreground/40 hover:text-primary/70 transition-colors"
            >
              Contribute
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
