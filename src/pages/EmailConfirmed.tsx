import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, GraduationCap, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Detect if user is on a mobile device
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobileDevice(mobile);

    // Force sign out — prevent any auto-login from confirmation tokens
    supabase.auth.signOut().catch(() => {});

    // On mobile, attempt deep link after 1.5s
    if (mobile) {
      const timer = setTimeout(() => {
        window.location.href = 'unigramm://login';
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center">
          <CheckCircle className="w-20 h-20 text-emerald-500 dark:text-emerald-400" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Email Confirmed!</h1>
          <p className="text-muted-foreground">
            Your Unigramm account is ready.
            {isMobileDevice
              ? ' Tap the button below to open the app and log in.'
              : ' You can now log in to your account.'}
          </p>
        </div>

        {isMobileDevice ? (
          <div className="space-y-4">
            <a
              href="unigramm://login"
              className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base"
            >
              Open Unigramm & Login
            </a>

            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Smartphone className="w-5 h-5" />
                <span className="font-medium">Or go back to the app manually</span>
              </div>
              <p className="text-sm text-muted-foreground">
                If the button above didn't work, open the Unigramm app and log in with your credentials.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full"
            >
              Log in here instead
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full"
              size="lg"
            >
              Go to Login
            </Button>
            <p className="text-sm text-muted-foreground">
              You are verified — log in when you're ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
