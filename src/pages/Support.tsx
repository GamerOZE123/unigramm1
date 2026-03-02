import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageCircle, FileText, ChevronDown, ExternalLink, HelpCircle, Shield, Bug, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  { q: 'How do I verify my university email?', a: 'Go to Settings → Account and tap "Verify Email". You\'ll receive a confirmation link at your .edu address.' },
  { q: 'Can I change my username?', a: 'Yes — head to Settings → Profile and update your username. It must be unique across the platform.' },
  { q: 'How does the dating feature work?', a: 'Set up your dating profile from the Discover tab. Swipe right to like, left to pass. If both users like each other, it\'s a match!' },
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Support</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10 pb-24">
        {/* Quick links */}
        <section className="grid grid-cols-2 gap-3">
          <a href="mailto:support@unigramm.com" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Email Us</span>
          </a>
          <a href="/communities" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Community</span>
          </a>
          <a href="/privacy-policy.html" target="_blank" rel="noopener" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Privacy Policy</span>
          </a>
          <a href="https://unigramm.com" target="_blank" rel="noopener" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <ExternalLink className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Website</span>
          </a>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
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
                      <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Contact Us</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    category === cat.label
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Textarea
              placeholder="Describe your issue or suggestion…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </section>
      </div>
    </div>
  );
}
