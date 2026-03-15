import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CtaSection() {
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
        toast.success("You're in!");
      }
    } catch { toast.error('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <section id="cta-section" style={{ background: '#0f1525', padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)' }}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden"
          style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.15)' }}
        >
          {/* Gradient glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(79,142,255,0.08)' }} />

          <h2 className="relative z-10 mb-3" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 700 }}>
            Your college needs Unigramm.
          </h2>
          <p className="relative z-10 text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Get notified when we launch at your campus.
          </p>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl relative z-10"
              style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)' }}>
              <CheckCircle className="w-4 h-4 text-[#38bdf8]" />
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>You're on the list!</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="flex-1 h-11 px-4 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.15)', color: '#fff' }}
              />
              <button type="submit" disabled={loading}
                className="h-11 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110 shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)', color: '#080c17' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Get access <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
