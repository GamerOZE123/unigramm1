import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailTemplate {
  key: string;
  label: string;
  description: string;
  badge?: string;
  type: 'edge-function' | 'auth';
  functionName?: string;
  bodyBuilder?: (email: string) => Record<string, any>;
  authAction?: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Auth emails
  {
    key: 'signup-confirm',
    label: 'Signup Confirmation',
    description: 'Email verification sent after user signs up',
    badge: 'Auth',
    type: 'auth',
    authAction: 'signup',
  },
  {
    key: 'password-reset',
    label: 'Password Reset',
    description: 'Forgot password / reset link email',
    badge: 'Auth',
    type: 'auth',
    authAction: 'recovery',
  },
  {
    key: 'magic-link',
    label: 'Magic Link',
    description: 'Passwordless login via email link',
    badge: 'Auth',
    type: 'auth',
    authAction: 'magiclink',
  },
  // Custom edge function emails
  {
    key: 'invite',
    label: 'Invite Email (iOS + Android)',
    description: 'Welcome invite sent when a waitlist user is approved',
    badge: 'Waitlist',
    type: 'edge-function',
    functionName: 'send-invite',
    bodyBuilder: (email) => ({ email, name: 'Test User' }),
  },
  {
    key: 'android-invite',
    label: 'Android Beta Invite',
    description: 'Android-specific download link email',
    badge: 'Android',
    type: 'edge-function',
    functionName: 'send-android-invite',
    bodyBuilder: (email) => ({ email }),
  },
];

const AdminEmailTemplates: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [sentKeys, setSentKeys] = useState<Set<string>>(new Set());
  const [failedKeys, setFailedKeys] = useState<Set<string>>(new Set());

  const handleSend = async (template: EmailTemplate) => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingKey(template.key);
    setFailedKeys(prev => { const n = new Set(prev); n.delete(template.key); return n; });

    try {
      if (template.type === 'edge-function' && template.functionName && template.bodyBuilder) {
        const { data, error } = await supabase.functions.invoke(template.functionName, {
          body: template.bodyBuilder(testEmail),
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      } else if (template.type === 'auth') {
        switch (template.authAction) {
          case 'signup': {
            // Sign up with a random password to trigger confirmation email
            const tempPassword = `TestPass_${Date.now()}!`;
            const { error } = await supabase.auth.signUp({
              email: testEmail,
              password: tempPassword,
            });
            if (error) throw error;
            break;
          }
          case 'recovery': {
            const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            break;
          }
          case 'magiclink': {
            const { error } = await supabase.auth.signInWithOtp({
              email: testEmail,
            });
            if (error) throw error;
            break;
          }
          default:
            throw new Error('Unknown auth action');
        }
      }

      setSentKeys(prev => new Set(prev).add(template.key));
      toast.success(`${template.label} sent to ${testEmail}`);
    } catch (err: any) {
      setFailedKeys(prev => new Set(prev).add(template.key));
      toast.error(err.message || `Failed to send ${template.label}`);
    }

    setSendingKey(null);
  };

  const handleSendAll = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    for (const template of EMAIL_TEMPLATES) {
      await handleSend(template);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Input */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="w-5 h-5 text-primary" />
            Test Email Address
          </CardTitle>
          <CardDescription>
            Enter the email address to receive test emails. All templates below will be sent to this address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="test-email" className="sr-only">Email</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="you@gmail.com"
                value={testEmail}
                onChange={(e) => {
                  setTestEmail(e.target.value);
                  setSentKeys(new Set());
                  setFailedKeys(new Set());
                }}
              />
            </div>
            <Button
              onClick={handleSendAll}
              disabled={!testEmail || sendingKey !== null}
              variant="default"
            >
              <Send className="w-4 h-4 mr-2" />
              Send All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info note */}
      <div className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong>Auth</strong> emails (Signup, Reset, Magic Link) are sent via Supabase Auth.
          Signup will create a test account. <strong>Waitlist/Android</strong> emails use custom edge functions.
        </p>
      </div>

      {/* Email Templates */}
      <div className="grid gap-3">
        {EMAIL_TEMPLATES.map((template) => {
          const isSending = sendingKey === template.key;
          const isSent = sentKeys.has(template.key);
          const isFailed = failedKeys.has(template.key);

          return (
            <Card key={template.key} className="border-border/40">
              <CardContent className="pt-5 pb-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground text-sm">{template.label}</p>
                    {template.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {template.badge}
                      </Badge>
                    )}
                    {isSent && (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                    {isFailed && (
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSend(template)}
                  disabled={!testEmail || sendingKey !== null}
                  className="shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Send
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminEmailTemplates;
