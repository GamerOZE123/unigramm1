import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Mail, ExternalLink, Shield, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
      return <p key={i} className="font-medium text-foreground mt-3 first:mt-0">{trimmed.replace(/\*\*/g, '')}</p>;
    }
    if (trimmed.startsWith('**') && trimmed.includes('**')) {
      const parts = trimmed.split('**');
      return (
        <p key={i} className="font-medium text-foreground mt-3 first:mt-0">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        </p>
      );
    }
    if (trimmed.startsWith('•')) {
      return <p key={i} className="text-sm text-muted-foreground pl-3 py-0.5">{trimmed}</p>;
    }
    return <p key={i} className="text-sm text-muted-foreground">{trimmed}</p>;
  });
}

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-10 pb-24">
        {/* Quick links */}
        <section className="grid grid-cols-2 gap-3">
          <a href="mailto:manage@unigramm.com" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Email Us</span>
          </a>
          <a href="/support" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Support</span>
          </a>
          <a href="https://unigramm.com" target="_blank" rel="noopener" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <ExternalLink className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Website</span>
          </a>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Last Updated: Feb 5, 2026</span>
          </div>
        </section>

        {/* Intro */}
        <section>
          <div className="border border-border rounded-xl bg-card p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Welcome to UnigrammApp ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your personal information. By using UnigrammApp, you agree to the collection and use of information in accordance with this policy.
            </p>
          </div>
        </section>

        {/* Accordion sections */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Policy Details</h2>
          <div className="space-y-2">
            {sections.map((section, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
                <button
                  onClick={() => setOpenSection(openSection === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground pr-4">{section.title}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openSection === i ? 'rotate-180' : ''}`} />
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
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Contact Us</h2>
          <div className="border border-border rounded-xl bg-card p-4 space-y-2">
            <p className="text-sm text-muted-foreground">If you have questions, concerns, or requests regarding this Privacy Policy or your data:</p>
            <p className="text-sm text-muted-foreground">• <strong className="text-foreground">Email:</strong> <a href="mailto:manage@unigramm.com" className="text-primary hover:underline">manage@unigramm.com</a></p>
            <p className="text-sm text-muted-foreground">• <strong className="text-foreground">Website:</strong> <a href="https://unigramm.com" target="_blank" rel="noopener" className="text-primary hover:underline">unigramm.com</a></p>
            <p className="text-sm text-muted-foreground">• <strong className="text-foreground">App Support:</strong> <a href="/support" className="text-primary hover:underline">Help & Support</a></p>
          </div>
        </section>

        <p className="text-xs text-center text-muted-foreground">By using Unigramm, you acknowledge that you have read and understood this Privacy Policy.</p>
      </div>
    </div>
  );
}
