import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mail, ExternalLink, Shield, MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/unigramm-logo.png';

const sections = [
  {
    title: 'What We Collect',
    content: `We collect only what we need to make Unigramm work for you.

**Your account details**
- Name, username, email address, and password
- Profile info you choose to add: university, major, graduation year, bio, profile photo

**What you do on Unigramm**
- Posts, comments, poll votes, and media you share
- Messages you send in chats
- Clubs and startups you join or create
- Your timetable data

**Basic technical info**
- Device type and OS version
- Push notification token so we can send you alerts
- Crash logs to help us fix bugs`,
  },
  {
    title: 'How We Use It',
    content: `We use your information to run Unigramm — nothing more.

- To create and manage your account
- To show you content relevant to your campus
- To deliver messages and notifications
- To connect you with clubs and students at your university
- To keep the app secure and improve it over time

We don't use your data for advertising. We don't build profiles to sell. Simple as that.`,
  },
  {
    title: 'How We Store and Protect It',
    content: `Your data is stored on secure, industry-standard cloud infrastructure.

- All data in transit is encrypted
- Passwords are hashed — we can never see them
- Access to your data is strictly limited to what's needed to run the service

We take security seriously. No system is perfectly invulnerable — if something ever goes wrong, we'll tell you promptly.`,
  },
  {
    title: 'Who We Share It With',
    content: `We do not sell your data. Ever.

Your information only leaves Unigramm in these situations:

- With other users — your profile and posts are visible to other Unigramm users as you'd expect
- With infrastructure providers — we use trusted third-party services to run the platform. They only process data to provide their services to us, nothing else.
- When the law requires it — if we receive a valid legal request, we may be required to share certain information
- To protect safety — if there's a credible threat to someone's safety, we may act on it

No data brokers. No ad networks. No selling to anyone.`,
  },
  {
    title: 'Your Rights',
    content: `You're in control of your data on Unigramm.

- Edit or update your profile anytime from Settings
- Delete any post, comment, or media you've created
- Leave any club or group you've joined
- Manage notification preferences from your device settings
- Delete your account entirely from Settings → Delete Account

When you delete your account, your personal data is permanently removed within 30 days.

Have a question about your data? Email us at manage@unigramm.com — we'll get back to you within 7 days.`,
  },
  {
    title: 'Age Requirement',
    content: `Unigramm is for university students aged 18 and above.

We don't knowingly collect data from anyone under 18. If we find out a minor has an account, we'll remove it immediately.

If you think someone underage is using Unigramm, let us know at manage@unigramm.com.`,
  },
  {
    title: 'Indian Data Protection',
    content: `Unigramm is an India-first product. We comply with applicable Indian data protection laws including the Digital Personal Data Protection Act, 2023 (DPDP Act).

Under the DPDP Act, you have the right to:
- Know what personal data we hold about you
- Correct inaccurate data
- Request erasure of your data
- Withdraw consent at any time

To exercise any of these rights, contact us at manage@unigramm.com.`,
  },
  {
    title: 'Updates to This Policy',
    content: `We'll update this policy as Unigramm grows. When we make significant changes, we'll notify you through the app and update the date below.

If you continue using Unigramm after an update, that means you're okay with the changes. If you're not, you can delete your account at any time.`,
  },
];

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return (
        <p key={i} className="font-semibold text-white mt-4 first:mt-0">
          {trimmed.replace(/\*\*/g, '')}
        </p>
      );
    }
    if (trimmed.startsWith('**') && trimmed.includes('**')) {
      const parts = trimmed.split('**');
      return (
        <p key={i} className="font-medium text-white mt-4 first:mt-0">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        </p>
      );
    }
    if (trimmed.startsWith('•')) {
      return (
        <p key={i} className="text-sm pl-3 py-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {trimmed}
        </p>
      );
    }
    return (
      <p key={i} className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {trimmed}
      </p>
    );
  });
}

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <div className="min-h-screen text-white" style={{ background: '#080c17', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4f8eff' }}>Legal</p>
          <h1 style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Last updated: March 18, 2026</p>
        </motion.div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: Mail, label: 'Email Us', href: 'mailto:manage@unigramm.com' },
            { icon: MessageCircle, label: 'Support', href: '/support' },
            { icon: ExternalLink, label: 'Website', href: 'https://unigramm.com' },
            { icon: Shield, label: 'Delete Account', href: '/delete-account' },
          ].map((link) => (
            <
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

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-5 mb-8"
          style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.1)' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Unigramm is built for students, by students. We believe your data belongs to you — not to advertisers, not to data brokers, not to us beyond what's needed to run the app. This policy explains what we collect, why we collect it, and what you can do about it. We've written it to be read, not just scrolled past.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-2 mb-12">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-xl overflow-hidden"
              style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.08)' }}
            >
              <button
                onClick={() => setOpenSection(openSection === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white pr-4">{section.title}</span>
                <ChevronDown
                  className="w-4 h-4 shrink-0 transition-transform"
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    transform: openSection === i ? 'rotate(180deg)' : undefined,
                  }}
                />
              </button>
              <AnimatePresence>
                {openSection === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-1">
                      {renderContent(section.content)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <div
          className="rounded-xl p-5 mb-8"
          style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.1)' }}
        >
          <h3 className="text-sm font-semibold text-white mb-3">Contact Us</h3>
          <div className="space-y-1.5">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              • <span className="text-white font-medium">Email:</span>{' '}
              <a href="mailto:manage@unigramm.com" className="hover:underline" style={{ color: '#4f8eff' }}>
                manage@unigramm.com
              </a>
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              • <span className="text-white font-medium">Website:</span>{' '}
              <a href="https://unigramm.com" target="_blank" rel="noopener" className="hover:underline" style={{ color: '#4f8eff' }}>
                unigramm.com
              </a>
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              • <span className="text-white font-medium">Support:</span>{' '}
              <a href="/support" className="hover:underline" style={{ color: '#4f8eff' }}>
                Help & Support
              </a>
            </p>
          </div>
        </div>

        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          By using Unigramm, you agree to this Privacy Policy.
        </p>
      </div>

      {/* Footer */}
      <footer
        className="border-t"
        style={{
          borderColor: 'rgba(79,142,255,0.08)',
          padding: 'clamp(1.25rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Unigramm" className="h-4" />
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} Unigramm
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/support" className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Support
            </a>
            <a href="/" className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Home
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}