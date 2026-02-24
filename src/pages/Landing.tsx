import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, MessageCircle, Users, Briefcase, Heart,
  TrendingUp, Shield, Zap, Globe, ChevronRight, Star, ArrowRight
} from 'lucide-react';

const words = ['connect', 'discover', 'grow', 'belong'];

const floatingIcons = [
  { icon: MessageCircle, x: '12%', y: '20%', delay: 0, size: 20 },
  { icon: Heart, x: '85%', y: '15%', delay: 0.5, size: 18 },
  { icon: Users, x: '8%', y: '65%', delay: 1, size: 22 },
  { icon: Briefcase, x: '88%', y: '60%', delay: 1.5, size: 16 },
  { icon: TrendingUp, x: '20%', y: '80%', delay: 2, size: 18 },
  { icon: Shield, x: '78%', y: '78%', delay: 0.8, size: 20 },
];

const features = [
  { icon: MessageCircle, title: 'Chat', description: 'Real-time campus messaging' },
  { icon: Users, title: 'Clubs', description: 'Find your community' },
  { icon: Briefcase, title: 'Jobs', description: 'Opportunities for students' },
  { icon: Heart, title: 'Dating', description: 'Meet people on campus' },
  { icon: TrendingUp, title: 'Startups', description: 'Build something great' },
  { icon: Shield, title: 'Confessions', description: 'Share anonymously' },
];

function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative h-[1.15em] overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="inline-block text-transparent bg-clip-text university-gradient"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">Unigramm</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground">
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="btn-primary text-sm px-5">
              Sign up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center justify-center px-5">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/6 blur-[150px] pointer-events-none" />

        {/* Floating icons */}
        {floatingIcons.map((item, i) => (
          <motion.div
            key={i}
            className="absolute hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-card/60 border border-border/40 backdrop-blur-sm"
            style={{ left: item.x, top: item.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: 1,
              y: [0, -12, 0],
            }}
            transition={{
              delay: item.delay,
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <item.icon className="text-primary/60" style={{ width: item.size, height: item.size }} />
          </motion.div>
        ))}

        <motion.div
          className="max-w-2xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-card/40 backdrop-blur-sm text-xs text-muted-foreground mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Built for university students
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
            Where students
            <br />
            <RotatingWord />
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
            Your campus community — chat, clubs, jobs, dating, and more — in one beautiful app.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="btn-primary text-sm px-8 py-5 w-full sm:w-auto group"
            >
              Get started free
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground w-full sm:w-auto"
            >
              I have an account
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-border/40 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-muted-foreground/40" />
          </div>
        </motion.div>
      </section>

      {/* Feature pills */}
      <section className="py-16 px-5 border-t border-border/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/30 hover:bg-card/70 transition-all duration-300 cursor-default"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-5">
        <motion.div
          className="max-w-xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-0.5 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-primary text-primary" />
            ))}
          </div>
          <blockquote className="text-base sm:text-lg font-medium text-foreground/90 leading-relaxed mb-4 italic">
            "Unigramm changed how I experience university — study groups, internships, friends — all here."
          </blockquote>
          <p className="text-xs text-muted-foreground">— Student at Cairo University</p>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5">
        <motion.div
          className="max-w-md mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Join your campus
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Free to use. Takes 30 seconds.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="btn-primary text-sm px-10 py-5 group"
          >
            Create account
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 px-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Unigramm</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Unigramm
          </p>
        </div>
      </footer>
    </div>
  );
}
