import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const words = ['connect', 'discover', 'grow', 'explore', 'belong'];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % words.length), 2200);
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
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
          style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function AnimatedCounter({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1800;
        const step = (ts: number) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          setCount(Math.floor(progress * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Clash Display', sans-serif", color: '#4f8eff' }}>
        {count}{suffix}
      </div>
      <div className="text-xs sm:text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
    </div>
  );
}

function PhoneMockup({ src, rotate, delay }: { src: string; rotate: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative shrink-0"
      style={{ transform: `rotate(${rotate}deg)`, width: 'clamp(120px, 22vw, 200px)' }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-[20px] overflow-hidden border-2 shadow-2xl"
        style={{ borderColor: 'rgba(79,142,255,0.15)', boxShadow: '0 20px 60px rgba(79,142,255,0.1)' }}
      >
        <img src={src} alt="App screenshot" className="w-full h-auto" />
      </motion.div>
    </motion.div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('early_access_signups').insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === '23505') { toast.info("You're already on the list!"); setSubmitted(true); }
        else toast.error('Something went wrong.');
      } else {
        setSubmitted(true);
        toast.success("You're in! We'll notify you when Unigramm launches.");
      }
    } catch { toast.error('Something went wrong.'); }
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)' }}>
        <CheckCircle className="w-4 h-4 text-[#38bdf8]" />
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>You're on the list!</span>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
      <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required
        className="flex-1 h-11 px-4 rounded-xl text-sm outline-none transition-all"
        style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.2)', color: '#fff' }}
      />
      <button type="submit" disabled={loading}
        className="h-11 px-5 rounded-xl text-sm font-semibold shrink-0 flex items-center gap-1.5 transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)', color: '#080c17' }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Join waitlist <ArrowRight className="w-3.5 h-3.5" /></>}
      </button>
    </form>
  );
}

export default function HeroSection({ indiaMap, screenshots }: { indiaMap: string; screenshots: string[] }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ padding: 'clamp(5rem, 10vw, 8rem) clamp(1rem, 4vw, 2rem) clamp(2rem, 6vw, 4rem)' }}>
      {/* India map bg */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img src={indiaMap} alt="" className="w-[70%] max-w-[600px] opacity-[0.09]" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="mb-4" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(2.2rem, 6vw, 4rem)', lineHeight: 1.1, fontWeight: 700 }}>
            Where students<br />
            <RotatingWord />
          </h1>
          <p className="mx-auto mb-8" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', color: 'rgba(255,255,255,0.45)', maxWidth: '420px', lineHeight: 1.6 }}>
            Chat, clubs, jobs, dating & more — your entire campus life in one app. Currently live at SNU.
          </p>
          <div className="flex justify-center mb-12">
            <WaitlistForm />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-3 gap-6 sm:gap-10 mb-14" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <AnimatedCounter target={240} suffix="+" label="Students waiting" />
          <AnimatedCounter target={7} suffix="" label="Features live" />
          <AnimatedCounter target={15} suffix="+" label="Student startups" />
        </motion.div>

        {/* Phone mockups */}
        <div className="flex items-center justify-center gap-3 sm:gap-5" style={{ perspective: '1000px' }}>
          <PhoneMockup src={screenshots[0]} rotate={-8} delay={0.4} />
          <PhoneMockup src={screenshots[1]} rotate={0} delay={0.5} />
          <PhoneMockup src={screenshots[2]} rotate={8} delay={0.6} />
        </div>
      </div>
    </section>
  );
}
