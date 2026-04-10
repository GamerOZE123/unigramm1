import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    if (target === 0) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        started.current = true;
        observer.disconnect();
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
    if (started.current) {
      // Target updated after already visible — just animate directly
      let start = 0;
      const duration = 1800;
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } else if (ref.current) {
      observer.observe(ref.current);
    }
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
      style={{ transform: `rotate(${rotate}deg)`, width: 'clamp(90px, 22vw, 200px)' }}
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

export default function HeroSection({ indiaMap, screenshots }: { indiaMap: string; screenshots: string[] }) {
  const [userCount, setUserCount] = useState(0);
  const [startupCount, setStartupCount] = useState(15);

  useEffect(() => {
    const fetchCounts = async () => {
      const [profilesRes, startupRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('student_startups').select('id', { count: 'exact', head: true }),
      ]);
      if (profilesRes.count && profilesRes.count > 0) setUserCount(profilesRes.count);
      if (startupRes.count && startupRes.count > 0) setStartupCount(startupRes.count);
    };
    fetchCounts();
  }, []);

  const scrollToWaitlist = () => {
    document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' });
  };

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
            Chat, clubs, jobs & more — your entire campus life in one app. Currently going live at SNU.
          </p>
          
          {/* Two CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={scrollToWaitlist}
              className="h-11 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)', color: '#080c17' }}
            >
              Get access <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="/contribute"
              className="h-11 px-6 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:bg-[#4f8eff]/10"
              style={{ border: '1px solid rgba(79,142,255,0.35)', color: '#4f8eff' }}
            >
              <Users className="w-3.5 h-3.5" /> Be a part of Unigramm
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-3 gap-6 sm:gap-10 mb-14" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <AnimatedCounter target={userCount} suffix="" label="Users" />
          <AnimatedCounter target={7} suffix="" label="Features live" />
          <AnimatedCounter target={startupCount} suffix="" label="Student startups" />
        </motion.div>

        {/* Phone mockups */}
        <div className="flex items-center justify-center gap-2 sm:gap-5 mx-auto w-full max-w-[340px] sm:max-w-none" style={{ perspective: '1000px' }}>
          <PhoneMockup src={screenshots[0]} rotate={-8} delay={0.4} />
          <PhoneMockup src={screenshots[1]} rotate={0} delay={0.5} />
          <PhoneMockup src={screenshots[2]} rotate={8} delay={0.6} />
        </div>
      </div>
    </section>
  );
}
