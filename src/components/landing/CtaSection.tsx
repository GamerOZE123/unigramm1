import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CtaSection() {
  const [formData, setFormData] = useState({ full_name: '', email: '', university: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEduEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return 'Email is required';
    if (!trimmed.endsWith('.edu') && !trimmed.endsWith('.edu.in') && !trimmed.endsWith('.ac.in')) {
      return 'Please use your college email (.edu / .edu.in / .ac.in)';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEduEmail(formData.email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError('');
    if (!formData.full_name.trim()) return;
    setLoading(true);
    try {
      const { error: dbError } = await supabase.from('early_access_signups').insert({
        email: formData.email.trim().toLowerCase(),
        full_name: formData.full_name.trim(),
        university: formData.university.trim() || null,
      });
      if (dbError) {
        if (dbError.code === '23505') { toast.info("You're already on the list!"); setSubmitted(true); }
        else toast.error('Something went wrong.');
      } else {
        setSubmitted(true);
        toast.success("You're in! We'll notify you when Unigramm launches.");
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

          <h2 className="relative z-10 mb-2" style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', fontWeight: 700 }}>
            Get early access
          </h2>
          <p className="relative z-10 text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Join the waitlist with your college email and be the first to know when we launch at your campus.
          </p>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl relative z-10"
              style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)' }}>
              <CheckCircle className="w-4 h-4 text-[#38bdf8]" />
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>You're on the list!</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 max-w-md mx-auto space-y-3">
              {/* Name */}
              <input
                type="text"
                placeholder="Full name *"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.15)', color: '#fff' }}
              />
              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="your@college.edu *"
                  value={formData.email}
                  onChange={(e) => { setFormData(prev => ({ ...prev, email: e.target.value })); setEmailError(''); }}
                  required
                  className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                  style={{
                    background: 'rgba(79,142,255,0.06)',
                    border: `1px solid ${emailError ? 'rgba(239,68,68,0.5)' : 'rgba(79,142,255,0.15)'}`,
                    color: '#fff',
                  }}
                />
                {emailError && (
                  <p className="text-xs mt-1 text-left" style={{ color: '#ef4444' }}>{emailError}</p>
                )}
              </div>
              {/* University */}
              <input
                type="text"
                placeholder="University name"
                value={formData.university}
                onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.15)', color: '#fff' }}
              />
              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)', color: '#080c17' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Join waitlist <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Only .edu, .edu.in, and .ac.in emails accepted
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
