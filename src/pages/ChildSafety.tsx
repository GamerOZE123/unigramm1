import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Shield, AlertTriangle, Ban, Mail, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ChildSafety() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Child Safety Standards — Unigramm</title>
        <meta name="description" content="Unigramm's child safety standards and zero-tolerance policy toward CSAE content." />
      </Helmet>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Child Safety Standards</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-24">
        {/* Header */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Unigramm Child Safety Standards</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unigramm is committed to creating a safe environment for all users. We have a zero-tolerance policy toward child sexual abuse and exploitation (CSAE) content, including child sexual abuse material (CSAM). This page outlines our standards, policies, and procedures to prevent, detect, and respond to any such content or behavior on our platform.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">Last Updated: March 2, 2026</span>
          </div>
        </section>

        {/* Age Requirement */}
        <section className="border border-border rounded-xl bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            <h3 className="text-base font-semibold text-foreground">Age Requirement</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unigramm is designed exclusively for university students and individuals aged 18 and older. We do not knowingly allow users under the age of 18 to create accounts or access the platform. If we become aware that a user is under 18, their account will be immediately suspended and removed.
          </p>
        </section>

        {/* Zero Tolerance */}
        <section className="border border-border rounded-xl bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="text-base font-semibold text-foreground">Zero-Tolerance Policy for CSAE/CSAM</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unigramm maintains a strict zero-tolerance policy against all forms of child sexual abuse and exploitation. This includes but is not limited to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground pl-1">
            <li className="flex gap-2"><span className="text-destructive font-bold">•</span> Sharing, distributing, or storing child sexual abuse material (CSAM)</li>
            <li className="flex gap-2"><span className="text-destructive font-bold">•</span> Grooming or solicitation of minors</li>
            <li className="flex gap-2"><span className="text-destructive font-bold">•</span> Any content that sexualizes, exploits, or endangers children</li>
            <li className="flex gap-2"><span className="text-destructive font-bold">•</span> Promoting, glorifying, or facilitating child exploitation in any form</li>
            <li className="flex gap-2"><span className="text-destructive font-bold">•</span> Using the platform to contact, lure, or exploit minors</li>
          </ul>
        </section>

        {/* Prevention Measures */}
        <section className="border border-border rounded-xl bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Prevention Measures</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unigramm employs a combination of technical safeguards and human oversight to prevent CSAE content from appearing on our platform:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground pl-1">
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> <strong className="text-foreground">Age Verification:</strong> All users must be 18+ to register. University email or student status verification may be required.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> <strong className="text-foreground">Content Moderation:</strong> We use automated systems and manual review processes to detect and remove prohibited content.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> <strong className="text-foreground">User Reporting:</strong> Users can report any suspicious content or behavior directly within the app. Reports are reviewed promptly.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> <strong className="text-foreground">Account Monitoring:</strong> Suspicious accounts or activity patterns are flagged, investigated, and actioned swiftly.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> <strong className="text-foreground">Staff Training:</strong> Our moderation and support teams are trained on identifying and responding to CSAE indicators.</li>
          </ul>
        </section>

        {/* Detection & Reporting */}
        <section className="border border-border rounded-xl bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Detection & Response</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When CSAE content or behavior is identified on Unigramm, we take the following actions:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground pl-1">
            <li className="flex gap-2"><span className="text-primary font-bold">1.</span> <strong className="text-foreground">Immediate Removal:</strong> The content is removed from the platform immediately upon detection.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">2.</span> <strong className="text-foreground">Account Suspension:</strong> The offending user's account is permanently banned without notice.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">3.</span> <strong className="text-foreground">Law Enforcement Reporting:</strong> We report all instances of CSAM to the National Center for Missing & Exploited Children (NCMEC) via the CyberTipline, and cooperate with law enforcement agencies as required.</li>
            <li className="flex gap-2"><span className="text-primary font-bold">4.</span> <strong className="text-foreground">Evidence Preservation:</strong> Relevant data is preserved in accordance with legal requirements to assist in investigations.</li>
          </ul>
        </section>

        {/* User Responsibility */}
        <section className="border border-border rounded-xl bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">User Responsibilities</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All Unigramm users are expected to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground pl-1">
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> Not upload, share, or distribute any content involving the exploitation of minors</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> Report any suspicious content or behavior immediately using the in-app reporting tools</li>
            <li className="flex gap-2"><span className="text-primary font-bold">•</span> Not use the platform to engage in any activity that could harm or endanger children</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="border border-border rounded-xl bg-card p-5 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Contact Us</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you encounter any content or behavior on Unigramm that you believe violates our child safety standards, please contact us immediately:
          </p>
          <div className="space-y-2">
            <a href="mailto:manage@unigramm.com" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">manage@unigramm.com</span>
            </a>
            <a href="https://unigramm.com" target="_blank" rel="noopener" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">unigramm.com</span>
            </a>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can also report CSAM directly to the <a href="https://www.missingkids.org/gethelpnow/cybertipline" target="_blank" rel="noopener" className="text-primary hover:underline">NCMEC CyberTipline</a>.
          </p>
        </section>

        <p className="text-xs text-center text-muted-foreground">
          Unigramm is committed to the safety and well-being of all individuals. We continuously review and update our child safety standards to ensure the highest level of protection.
        </p>
      </div>
    </div>
  );
}
