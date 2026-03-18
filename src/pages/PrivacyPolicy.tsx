import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mail, ExternalLink, Shield, MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImg from '@/assets/unigramm-logo.png';

const sections = [
  {
    title: 'Information We Collect',
    content: `**Personal Information You Provide**
• Account Information: Username, email address, password (encrypted)
• Profile Information: Full name, profile picture, bio, academic status (university, graduation year, major)
• Club Affiliations: Information about clubs you join or create
• User-Generated Content: Posts, comments, messages, advertisements, and media you upload
• Draft Content: Saved drafts of posts and content

**Automatically Collected Information**
• Device Information: Device type, operating system version, unique device identifiers
• Usage Data: App interactions, features used, time spent in the app
• Log Data: Error logs, crash reports, and diagnostic information
• Push Notification Tokens: Firebase Cloud Messaging (FCM) tokens for sending notifications

**Information from Third Parties**
• Firebase Services: We use Firebase for authentication, cloud messaging, and analytics
• Supabase: Our backend database service that stores your data`,
  },
  {
    title: 'How We Use Your Information',
    content: `• Providing Services: To create and manage your account, enable posting, messaging, and social interactions
• Personalization: To customize your feed, suggest relevant content, and improve your experience
• Communication: To send you notifications about messages, comments, likes, and app updates
• Academic Features: To connect you with users from your university and relevant clubs
• Safety & Security: To detect and prevent fraud, abuse, and security incidents
• Analytics: To understand how users interact with the app and improve features
• Legal Compliance: To comply with legal obligations and enforce our Terms of Service`,
  },
  {
    title: 'Data Storage and Security',
    content: `**Storage**
• Your data is stored securely using Supabase cloud infrastructure
• Local data is cached on your device using SQLite for offline functionality
• Media files (images, videos) are stored on secure cloud storage servers

**Security Measures**
• Encrypted data transmission (HTTPS/TLS)
• Secure password hashing and storage
• Regular security audits and updates
• Access controls and authentication mechanisms

However, no method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.`,
  },
  {
    title: 'Data Sharing and Disclosure',
    content: `**We Do NOT Sell Your Data.** We do not sell, rent, or trade your personal information to third parties for marketing purposes.

We may share your information in the following circumstances:
• With Other Users: Profile information, posts, and content you choose to share publicly
• Service Providers: Third-party services like Firebase and Supabase that help us operate the app
• Legal Requirements: When required by law, court order, or government request
• Safety & Protection: To protect the rights, property, or safety of our users and the public
• Business Transfers: In connection with a merger, acquisition, or sale of assets (with notice to users)`,
  },
  {
    title: 'Your Rights and Choices',
    content: `**Access and Control**
• Access Your Data: View and download the information we have about you
• Edit Your Profile: Update your profile information, academic status, and preferences at any time
• Delete Content: Remove your posts, comments, and messages
• Delete Account: Permanently delete your account and associated data through the app settings

**Privacy Settings**
• Profile Visibility: Control who can see your profile and posts
• Notifications: Manage notification preferences in Settings
• Data Collection: Opt out of certain data collection (where applicable)

**Data Retention**
• Active Accounts: We retain your data as long as your account is active
• Deleted Accounts: When you delete your account, we remove your personal information within 30 days
• Legal Obligations: Some data may be retained longer if required by law or for legitimate business purposes`,
  },
  {
    title: "Children's Privacy",
    content: `UnigrammApp is intended for university students and users 18 years or older. We do not knowingly collect information from children under 13. If we discover that a child under 13 has provided personal information, we will delete it immediately.`,
  },
  {
    title: 'Third-Party Services',
    content: `Our app integrates with third-party services that have their own privacy policies:
• Firebase (Google): firebase.google.com/support/privacy
• Supabase: supabase.com/privacy
• Expo: expo.dev/privacy

We are not responsible for the privacy practices of these third-party services.`,
  },
  {
    title: 'International Data Transfers',
    content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.`,
  },
  {
    title: 'Changes to This Privacy Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by:
• Posting the updated policy in the app
• Sending a notification through the app
• Updating the "Last Updated" date at the top of this policy

Your continued use of UnigrammApp after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: 'Your California Privacy Rights (CCPA)',
    content: `If you are a California resident, you have additional rights under the California Consumer Privacy Act:
• Right to know what personal information is collected
• Right to know if personal information is sold or disclosed
• Right to opt-out of the sale of personal information
• Right to request deletion of personal information
• Right to non-discrimination for exercising your rights

To exercise these rights, please contact us at manage@unigramm.com.`,
  },
  {
    title: 'European Privacy Rights (GDPR)',
    content: `If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation:
• Right to access your personal data
• Right to rectification of inaccurate data
• Right to erasure ("right to be forgotten")
• Right to restrict processing
• Right to data portability
• Right to object to processing
• Right to withdraw consent

To exercise these rights, please contact us at manage@unigramm.com.`,
  },
];

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return <p key={i} className="font-medium text-white mt-4 first:mt-0">{trimmed.replace(/\*\*/g, '')}</p>;
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
      return <p key={i} className="text-sm pl-3 py-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{trimmed}</p>;
    }
    return <p key={i} className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{trimmed}</p>;
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
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Last updated: February 5, 2026</p>
        </motion.div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: Mail, label: 'Email Us', href: 'mailto:manage@unigramm.com' },
            { icon: MessageCircle, label: 'Support', href: '/support' },
            { icon: ExternalLink, label: 'Website', href: 'https://unigramm.com' },
            { icon: Shield, label: 'Delete Account', href: '/delete-account' },
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

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-5 mb-8"
          style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.1)' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Welcome to UnigrammApp ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your personal information. By using UnigrammApp, you agree to the collection and use of information in accordance with this policy.
          </p>
        </motion.div>

        {/* Accordion sections */}
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
                  style={{ color: 'rgba(255,255,255,0.3)', transform: openSection === i ? 'rotate(180deg)' : undefined }}
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
        <div className="rounded-xl p-5 mb-8" style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.1)' }}>
          <h3 className="text-sm font-semibold text-white mb-3">Contact Us</h3>
          <div className="space-y-1.5">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>• <span className="text-white font-medium">Email:</span> <a href="mailto:manage@unigramm.com" className="hover:underline" style={{ color: '#4f8eff' }}>manage@unigramm.com</a></p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>• <span className="text-white font-medium">Website:</span> <a href="https://unigramm.com" target="_blank" rel="noopener" className="hover:underline" style={{ color: '#4f8eff' }}>unigramm.com</a></p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>• <span className="text-white font-medium">App Support:</span> <a href="/support" className="hover:underline" style={{ color: '#4f8eff' }}>Help & Support</a></p>
          </div>
        </div>

        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          By using Unigramm, you acknowledge that you have read and understood this Privacy Policy.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'rgba(79,142,255,0.08)', padding: 'clamp(1.25rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Unigramm" className="h-4" />
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} Unigramm</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/support" className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>Support</a>
            <a href="/" className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>Home</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
