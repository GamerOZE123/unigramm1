import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, GraduationCap, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Detect if user is on a mobile device
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobileDevice(mobile);

    // If on desktop browser, auto-redirect to login after 5 seconds
    if (!mobile) {
      const timer = setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [navigate]);

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
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Email Confirmed!</h1>
          <p className="text-muted-foreground">
            Your email has been verified successfully. You can now log in to your account.
          </p>
        </div>

        {isMobileDevice ? (
          /* Mobile: Show "Open App" message */
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Smartphone className="w-5 h-5" />
                <span className="font-medium">Open the Unigramm app to log in</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Go back to the Unigramm app and log in with your credentials.
              </p>
            </div>

            <Button
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full"
            >
              Log in here instead
            </Button>
          </div>
        ) : (
          /* Desktop: Auto-redirect with manual button */
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full"
              size="lg"
            >
              Go to Login
            </Button>
            <p className="text-sm text-muted-foreground">
              You will be redirected automatically in a few seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
