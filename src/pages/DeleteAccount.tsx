import React, { useState } from 'react';
import { ArrowLeft, Trash2, AlertTriangle, Mail, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim()) {
      toast.error('Please provide your username and email');
      return;
    }

    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('account_deletion_requests')
        .insert({
          username: username.trim(),
          email: email.trim(),
          reason: reason.trim() || null,
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Deletion request submitted successfully');
    } catch (err) {
      console.error('Error submitting deletion request:', err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Delete Account</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
          >
            <Mail className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-xl font-semibold text-foreground">Request Submitted</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            We've received your account deletion request. You'll receive a confirmation email at <strong className="text-foreground">{email}</strong> within a few business days with further instructions.
          </p>
          <p className="text-xs text-muted-foreground">
            If you don't hear from us within 5 business days, please contact us at{' '}
            <a href="mailto:manage@unigramm.com" className="text-primary hover:underline">manage@unigramm.com</a>
          </p>
          <Button variant="outline" onClick={() => navigate('/')} className="mt-6">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Delete Account</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-24">
        {/* Warning */}
        <div className="flex gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">This action is permanent</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once your account is deleted, all your data including posts, messages, profile information, and any associated content will be permanently removed and cannot be recovered.
            </p>
          </div>
        </div>

        {/* Quick links */}
        <section className="grid grid-cols-2 gap-3">
          <a href="mailto:manage@unigramm.com" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Email Us</span>
          </a>
          <a href="/support" className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Support</span>
          </a>
        </section>

        {/* Form */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Request Account Deletion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Username *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Reason for leaving (optional)</label>
              <Textarea
                placeholder="Help us improve — tell us why you're leaving…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Type <span className="text-destructive font-bold">DELETE</span> to confirm *
              </label>
              <Input
                placeholder="Type DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={loading || confirmText !== 'DELETE'}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Submit Deletion Request
                </span>
              )}
            </Button>
          </form>
        </section>

        <p className="text-xs text-center text-muted-foreground">
          By submitting, you agree that your account and all associated data will be permanently deleted.
          For questions, contact <a href="mailto:manage@unigramm.com" className="text-primary hover:underline">manage@unigramm.com</a>
        </p>
      </div>
    </div>
  );
}
