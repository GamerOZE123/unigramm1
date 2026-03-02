import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

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

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
        <h1 className="text-2xl font-bold text-foreground">Privacy Policy for Unigramm</h1>
        <p className="text-xs text-muted-foreground">Last Updated: February 5, 2026</p>

        <h2>Introduction</h2>
        <p>Welcome to UnigrammApp ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your personal information. This Privacy Policy explains our practices regarding data collection and usage when you use our mobile application.</p>
        <p>By using UnigrammApp, you agree to the collection and use of information in accordance with this policy.</p>

        <h2>Information We Collect</h2>

        <h3>Personal Information You Provide</h3>
        <p>When you create an account and use UnigrammApp, we collect the following information:</p>
        <ul>
          <li><strong>Account Information:</strong> Username, email address, password (encrypted)</li>
          <li><strong>Profile Information:</strong> Full name, profile picture, bio, academic status (university, graduation year, major)</li>
          <li><strong>Club Affiliations:</strong> Information about clubs you join or create</li>
          <li><strong>User-Generated Content:</strong> Posts, comments, messages, advertisements, and media (photos, videos) you upload</li>
          <li><strong>Draft Content:</strong> Saved drafts of posts and content</li>
        </ul>

        <h3>Automatically Collected Information</h3>
        <p>We automatically collect certain information when you use the app:</p>
        <ul>
          <li><strong>Device Information:</strong> Device type, operating system version, unique device identifiers</li>
          <li><strong>Usage Data:</strong> App interactions, features used, time spent in the app</li>
          <li><strong>Log Data:</strong> Error logs, crash reports, and diagnostic information</li>
          <li><strong>Push Notification Tokens:</strong> Firebase Cloud Messaging (FCM) tokens for sending notifications</li>
        </ul>

        <h3>Information from Third Parties</h3>
        <ul>
          <li><strong>Firebase Services:</strong> We use Firebase for authentication, cloud messaging, and analytics</li>
          <li><strong>Supabase:</strong> Our backend database service that stores your data</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the collected information for the following purposes:</p>
        <ul>
          <li><strong>Providing Services:</strong> To create and manage your account, enable posting, messaging, and social interactions</li>
          <li><strong>Personalization:</strong> To customize your feed, suggest relevant content, and improve your experience</li>
          <li><strong>Communication:</strong> To send you notifications about messages, comments, likes, and app updates</li>
          <li><strong>Academic Features:</strong> To connect you with users from your university and relevant clubs</li>
          <li><strong>Safety & Security:</strong> To detect and prevent fraud, abuse, and security incidents</li>
          <li><strong>Analytics:</strong> To understand how users interact with the app and improve features</li>
          <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our Terms of Service</li>
        </ul>

        <h2>Data Storage and Security</h2>

        <h3>Storage</h3>
        <ul>
          <li>Your data is stored securely using Supabase cloud infrastructure</li>
          <li>Local data is cached on your device using SQLite for offline functionality</li>
          <li>Media files (images, videos) are stored on secure cloud storage servers</li>
        </ul>

        <h3>Security Measures</h3>
        <p>We implement industry-standard security measures to protect your information:</p>
        <ul>
          <li>Encrypted data transmission (HTTPS/TLS)</li>
          <li>Secure password hashing and storage</li>
          <li>Regular security audits and updates</li>
          <li>Access controls and authentication mechanisms</li>
        </ul>
        <p>However, no method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>

        <h2>Data Sharing and Disclosure</h2>

        <h3>We Do NOT Sell Your Data</h3>
        <p>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>

        <h3>When We May Share Information</h3>
        <p>We may share your information in the following circumstances:</p>
        <ul>
          <li><strong>With Other Users:</strong> Profile information, posts, and content you choose to share publicly</li>
          <li><strong>Service Providers:</strong> Third-party services like Firebase and Supabase that help us operate the app</li>
          <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
          <li><strong>Safety & Protection:</strong> To protect the rights, property, or safety of our users and the public</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
        </ul>

        <h2>Your Rights and Choices</h2>

        <h3>Access and Control</h3>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access Your Data:</strong> View and download the information we have about you</li>
          <li><strong>Edit Your Profile:</strong> Update your profile information, academic status, and preferences at any time</li>
          <li><strong>Delete Content:</strong> Remove your posts, comments, and messages</li>
          <li><strong>Delete Account:</strong> Permanently delete your account and associated data through the app settings</li>
        </ul>

        <h3>Privacy Settings</h3>
        <ul>
          <li><strong>Profile Visibility:</strong> Control who can see your profile and posts</li>
          <li><strong>Notifications:</strong> Manage notification preferences in Settings</li>
          <li><strong>Data Collection:</strong> Opt out of certain data collection (where applicable)</li>
        </ul>

        <h3>Data Retention</h3>
        <ul>
          <li><strong>Active Accounts:</strong> We retain your data as long as your account is active</li>
          <li><strong>Deleted Accounts:</strong> When you delete your account, we remove your personal information within 30 days</li>
          <li><strong>Legal Obligations:</strong> Some data may be retained longer if required by law or for legitimate business purposes</li>
        </ul>

        <h2>Children's Privacy</h2>
        <p>UnigrammApp is intended for university students and users 18 years or older. We do not knowingly collect information from children under 13. If we discover that a child under 13 has provided personal information, we will delete it immediately.</p>

        <h2>Third-Party Services</h2>
        <p>Our app integrates with third-party services that have their own privacy policies:</p>
        <ul>
          <li><strong>Firebase (Google):</strong> <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a></li>
          <li><strong>Supabase:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a></li>
          <li><strong>Expo:</strong> <a href="https://expo.dev/privacy" target="_blank" rel="noopener noreferrer">Expo Privacy Policy</a></li>
        </ul>
        <p>We are not responsible for the privacy practices of these third-party services.</p>

        <h2>International Data Transfers</h2>
        <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.</p>

        <h2>Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by:</p>
        <ul>
          <li>Posting the updated policy in the app</li>
          <li>Sending a notification through the app</li>
          <li>Updating the "Last Updated" date at the top of this policy</li>
        </ul>
        <p>Your continued use of UnigrammApp after changes constitutes acceptance of the updated policy.</p>

        <h2>Contact Us</h2>
        <p>If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:support@unigramm.com">support@unigramm.com</a></li>
          <li><strong>App Support:</strong> Use the <a href="/support">Help & Support</a> option in Settings</li>
        </ul>

        <h2>Your California Privacy Rights (CCPA)</h2>
        <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act:</p>
        <ul>
          <li>Right to know what personal information is collected</li>
          <li>Right to know if personal information is sold or disclosed</li>
          <li>Right to opt-out of the sale of personal information</li>
          <li>Right to request deletion of personal information</li>
          <li>Right to non-discrimination for exercising your rights</li>
        </ul>
        <p>To exercise these rights, please contact us using the information above.</p>

        <h2>European Privacy Rights (GDPR)</h2>
        <p>If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation:</p>
        <ul>
          <li>Right to access your personal data</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure ("right to be forgotten")</li>
          <li>Right to restrict processing</li>
          <li>Right to data portability</li>
          <li>Right to object to processing</li>
          <li>Right to withdraw consent</li>
        </ul>
        <p>To exercise these rights, please contact us using the information above.</p>

        <hr />
        <p className="text-xs text-muted-foreground"><strong>By using Unigramm, you acknowledge that you have read and understood this Privacy Policy.</strong></p>
      </div>
    </div>
  );
}
