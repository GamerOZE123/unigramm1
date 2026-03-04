import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, AlertTriangle, Mail, FileText, Shield, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setEmail(session.user.email);
        // Check if deletion is already pending
        const { data } = await supabase
          .from('profiles')
          .select('deletion_scheduled_at, deactivated_at')
          .eq('user_id', session.user.id)
          .single();
        if (data?.deletion_scheduled_at && data?.deactivated_at) {
          setPendingDeletion(data.deletion_scheduled_at);
        }
      }
    });
  }, []);

  const handleCancelDeletion = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { action: 'cancel' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPendingDeletion(null);
      toast.success('Account reactivated! Your account is safe.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel deletion');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please provide your email'); return; }
    if (confirmText !== 'DELETE') { toast.error('Please type DELETE to confirm'); return; }
    if (!agreed) { toast.error('Please agree to the terms'); return; }

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('delete-account', {
          body: { reason: reason.trim() || null, action: 'deactivate' },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setSubmitted(true);
        toast.success('Account deactivated');
        await supabase.auth.signOut();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to deactivate account');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('account_deletion_requests')
          .insert({ username: email.trim(), email: email.trim(), reason: reason.trim() || null });
        if (error) throw error;
        setSubmitted(true);
        toast.success('Deletion request submitted');
      } catch {
        toast.error('Failed to submit request. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header onBack={() => navigate('/')} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-primary" />
          </motion.div>
          {isLoggedIn ? (
            <>
              <h2 className="text-xl font-semibold text-foreground">Account Deactivated</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your account has been deactivated and is scheduled for permanent deletion in <strong className="text-foreground">30 days</strong>.
                Simply log back in anytime before then to cancel the deletion and reactivate your account.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground">Request Submitted</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                We've received your account deletion request. You'll receive a confirmation email at{' '}
                <strong className="text-foreground">{email}</strong> within a few business days.
              </p>
              <p className="text-xs text-muted-foreground">
                If you don't hear from us within 5 business days, contact{' '}
                <a href="mailto:manage@unigramm.com" className="text-primary hover:underline">manage@unigramm.com</a>
              </p>
            </>
          )}
          <Button variant="outline" onClick={() => navigate('/')} className="mt-6">Back to Home</Button>
        </div>
      </div>
    );
  }

  // Pending deletion state
  if (pendingDeletion) {
    const daysLeft = Math.max(0, Math.ceil((new Date(pendingDeletion).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return (
      <div className="min-h-screen bg-background">
        <Header onBack={() => navigate(-1)} />
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
          <div className="text-center space-y-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-destructive" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground">Deletion Pending</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your account is scheduled for permanent deletion in{' '}
              <strong className="text-destructive text-lg">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              All your data (posts, messages, matches, etc.) will be permanently removed on{' '}
              <strong className="text-foreground">{new Date(pendingDeletion).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
            </p>
          </div>

          <div className="flex gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <RotateCcw className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Changed your mind?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can cancel the deletion and reactivate your account right now. All your data is still intact.
              </p>
            </div>
          </div>

          <Button
            onClick={handleCancelDeletion}
            disabled={cancelling}
            className="w-full"
            size="lg"
          >
            {cancelling ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Reactivating…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Cancel Deletion & Reactivate Account
              </span>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            For questions, contact{' '}
            <a href="mailto:manage@unigramm.com" className="text-primary hover:underline">manage@unigramm.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onBack={() => navigate(-1)} />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Warning banner */}
        <div className="flex gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">30-day deactivation period</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your account will be deactivated immediately and scheduled for permanent deletion after 30 days.
              During this period, simply log back in to cancel the deletion and reactivate your account — just like X (Twitter) and Instagram.
            </p>
          </div>
        </div>

        {/* What gets deleted */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" /> What will be deleted after 30 days:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Profile, avatar, and banner</li>
            <li>All posts, comments, and likes</li>
            <li>Direct messages and group chats</li>
            <li>Dating profile and matches</li>
            <li>Club memberships and community data</li>
            <li>Marketplace listings and auction bids</li>
            <li>Notifications and device tokens</li>
          </ul>
        </div>

        {/* Not logged in notice */}
        {!isLoggedIn && (
          <div className="flex gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Not logged in</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For instant deactivation, please log in first. Otherwise you can submit a manual request below.
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate('/login')}>
                Log in to deactivate instantly
              </Button>
            </div>
          </div>
        )}

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
          <h2 className="text-base font-semibold text-foreground mb-4">
            {isLoggedIn ? 'Confirm Account Deactivation' : 'Request Account Deletion'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="Your registered email" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="pl-10" required readOnly={!!userEmail} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Reason for leaving (optional)</label>
              <Textarea placeholder="Help us improve — tell us why you're leaving…"
                value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Type <span className="text-destructive font-bold">DELETE</span> to confirm *
              </label>
              <Input placeholder="Type DELETE" value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)} required />
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
              <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
              <label htmlFor="agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                I understand that my account will be <strong className="text-foreground">deactivated immediately</strong> and
                permanently deleted after 30 days. I can cancel by logging back in during the grace period.
              </label>
            </div>

            <Button type="submit" variant="destructive" className="w-full"
              disabled={loading || confirmText !== 'DELETE' || !agreed}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {isLoggedIn ? 'Deactivating…' : 'Submitting…'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  {isLoggedIn ? 'Deactivate My Account' : 'Submit Deletion Request'}
                </span>
              )}
            </Button>
          </form>
        </section>

        <p className="text-xs text-center text-muted-foreground">
          For questions, contact{' '}
          <a href="mailto:manage@unigramm.com" className="text-primary hover:underline">manage@unigramm.com</a>
        </p>
      </div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Delete Account</h1>
      </div>
    </header>
  );
}
