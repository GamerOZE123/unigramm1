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
  { icon: MessageCircle, title: 'Chat', description: 'Real-time messaging' },
  { icon: Users, title: 'Clubs', description: 'Find your people' },
  { icon: Briefcase, title: 'Jobs', description: 'Campus opportunities' },
  { icon: Heart, title: 'Dating', description: 'Meet someone new' },
  { icon: TrendingUp, title: 'Startups', description: 'Build & launch' },
  { icon: Shield, title: 'Confessions', description: 'Stay anonymous' },
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
          initial={{ y: 40, opacity: 0, rotateX: -90 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: -40, opacity: 0, rotateX: 90 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block text-transparent bg-clip-text university-gradient"
          style={{ perspective: 200 }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function FloatingCard({ icon: Icon, title, description, index }: { icon: React.ElementType; title: string; description: string; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className="group cursor-default"
    >
      <div className="relative p-5 rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md hover:border-primary/20 hover:bg-card/60 transition-all duration-500">
        {/* 3D floating icon */}
        <motion.div
          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors duration-300"
          style={{ transform: 'translateZ(20px)' }}
        >
          <Icon className="w-5 h-5 text-primary" />
        </motion.div>
        <p className="text-sm font-semibold text-foreground mb-0.5" style={{ transform: 'translateZ(15px)' }}>{title}</p>
        <p className="text-xs text-muted-foreground" style={{ transform: 'translateZ(10px)' }}>{description}</p>

        {/* Subtle shine effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.06),transparent_60%)]" />
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
        toast.success("You're on the list! We'll notify you when Unigramm launches.");
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
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]"
      >
        <CheckCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">You're on the list!</span>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 w-full max-w-md">
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 h-11 bg-card/40 border-border/40 placeholder:text-muted-foreground/50 rounded-xl text-sm"
      />
      <Button
        type="submit"
        disabled={loading}
        className="btn-primary text-sm px-5 h-11 shrink-0 rounded-xl group"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Get access
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </Button>
    </form>
  );
}

function Orb() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(209 99% 65% / 0.08) 0%, transparent 70%)',
          top: '10%',
          right: '-10%',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Secondary orb */}
      <motion.div
        className="absolute w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(270 70% 60% / 0.05) 0%, transparent 70%)',
          bottom: '5%',
          left: '-5%',
        }}
        animate={{
          x: [0, -20, 0],
          y: [0, 15, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Orb />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-2xl border-b border-border/20">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="text-base font-bold tracking-tight text-foreground">Unigramm</span>
          </div>
          <button
            onClick={() => navigate('/contribute')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 group"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
            <span>Join the team</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center px-5 pt-14">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 sm:py-20">
          {/* Left: Copy */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm text-xs text-muted-foreground mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--warning))] animate-pulse" />
              Coming soon
            </motion.div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
              Where students
              <br />
              <RotatingWord />
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground max-w-sm mb-8 leading-relaxed">
              Your campus community — chat, clubs, jobs, dating & more — in one app.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <EarlyAccessForm />
            </motion.div>
          </motion.div>

          {/* Right: 3D Feature Cards */}
          <motion.div
            className="relative z-10 grid grid-cols-2 gap-3"
            style={{ perspective: 800 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {features.map((f, i) => (
              <FloatingCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
            ))}
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:block"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border border-border/30 flex items-start justify-center pt-1.5">
            <div className="w-0.5 h-2 rounded-full bg-muted-foreground/30" />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 py-6 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary/60" />
            <span className="text-xs font-medium text-muted-foreground">© {new Date().getFullYear()} Unigramm</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/support" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">Support</a>
            <a href="/privacy-policy" className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors">Privacy</a>
            <button
              onClick={() => window.location.href = '/contribute'}
              className="text-xs text-muted-foreground/60 hover:text-primary transition-colors"
            >
              Contribute
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
