import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, MessageCircle, FileText, ChevronDown, ExternalLink, HelpCircle, Shield, Bug, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import logoImg from '@/assets/unigramm-logo.png';

const faqs = [
  { q: 'How do I verify my university email?', a: 'Go to Settings → Account and tap "Verify Email". You\'ll receive a confirmation link at your .edu address.' },
  { q: 'Can I change my username?', a: 'Yes — head to Settings → Profile and update your username. It must be unique across the platform.' },
  { q: 'Is my data private?', a: 'Absolutely. We follow strict privacy policies. Your data is encrypted and never shared with third parties without consent.' },
  { q: 'How do I report a user?', a: 'Tap the three-dot menu on any profile or post, then select "Report". Our team reviews all reports within 24 hours.' },
  { q: 'How do I delete my account?', a: 'Go to Settings → Account → Delete Account. This action is permanent and cannot be undone.' },
];

const categories = [
  { label: 'General', icon: HelpCircle },
  { label: 'Bug Report', icon: Bug },
  { label: 'Feature Request', icon: Lightbulb },
  { label: 'Privacy & Safety', icon: Shield },
];

export default function Support() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [category, setCategory] = useState('General');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Your message has been sent! We\'ll get back to you soon.');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="min-h-screen text-white" style={{ background: '#080c17', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Helmet>
        <title>Support — Unigramm</title>
        <meta name="description" content="Get help with Unigramm — FAQs, contact support, and report issues." />
      </Helmet>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(8,12,23,0.8)', borderColor: 'rgba(79,142,255,0.08)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3" style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)' }}>
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl transition-colors hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>
          <a href="/">
            <img src={logoImg} alt="Unigramm" className="h-8 sm:h-10" />
          </a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6" style={{ paddingTop: 'clamp(5rem, 10vw, 7rem)', paddingBottom: 'clamp(3rem, 6vw, 5rem)' }}>
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4f8eff' }}>Help Center</p>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.1 }}>
            Support
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Get help, report issues, or share your ideas.</p>
        </motion.div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {[
            { icon: Mail, label: 'Email Us', href: 'mailto:support@unigramm.com' },
            { icon: MessageCircle, label: 'Community', href: '/communities' },
            { icon: FileText, label: 'Privacy Policy', href: '/privacy-policy' },
            { icon: Shield, label: 'Delete Account', href: '/delete-account' },
            { icon: ExternalLink, label: 'Website', href: 'https://unigramm.com' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener' : undefined}
              className="flex items-center gap-2.5 p-3.5 rounded-xl transition-colors hover:bg-white/5"
              style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.1)' }}
            >
              <link.icon className="w-4 h-4" style={{ color: '#4f8eff' }} />
              <span className="text-xs font-medium text-white">{link.label}</span>
            </a>
          ))}
        </div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4f8eff' }}>FAQ</p>
          <h2 className="text-lg font-bold text-white mb-5" style={{ fontFamily: "'Clash Display', sans-serif" }}>Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.08)' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform"
                    style={{ color: 'rgba(255,255,255,0.3)', transform: openFaq === i ? 'rotate(180deg)' : undefined }}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact form */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4f8eff' }}>Get in touch</p>
          <h2 className="text-lg font-bold text-white mb-5" style={{ fontFamily: "'Clash Display', sans-serif" }}>Contact Us</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all"
                  style={
                    category === cat.label
                      ? { background: 'rgba(79,142,255,0.15)', color: '#4f8eff', border: '1px solid rgba(79,142,255,0.3)' }
                      : { background: '#111827', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(79,142,255,0.08)' }
                  }
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-colors focus:border-[#4f8eff]/40"
              style={{ background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.15)', color: '#fff' }}
            />
            <textarea
              placeholder="Describe your issue or suggestion…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors focus:border-[#4f8eff]/40"
              style={{ background: 'rgba(79,142,255,0.06)', border: '1px solid rgba(79,142,255,0.15)', color: '#fff' }}
            />
            <button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #4f8eff, #38bdf8)', color: '#080c17' }}
            >
              Send Message <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'rgba(79,142,255,0.08)', padding: 'clamp(1.25rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Unigramm" className="h-4" />
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Unigramm</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/privacy-policy" className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>Privacy</a>
            <a href="/" className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>Home</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
