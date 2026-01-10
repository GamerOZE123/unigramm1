import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, CheckCircle, ArrowRight, GraduationCap, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AlumniConversionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'email' | 'otp' | 'converting' | 'complete';

export const AlumniConversionModal = ({ open, onClose, onComplete }: AlumniConversionModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEduEmail = (email: string) => email.toLowerCase().endsWith('.edu');

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (isEduEmail(email)) {
      setError('Please use a non-.edu email for your alumni account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real implementation, this would send an OTP
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Verification code sent to your email');
      setStep('otp');
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setError('Please enter the complete verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For demo purposes, accept any 6-digit code
      // In production, this would verify against the sent OTP
      setStep('converting');
      
      // Update profile to alumni status
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            account_status: 'alumni',
            personal_email: email,
            graduated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep('complete');
    } catch (err) {
      setError('Failed to verify. Please try again.');
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    toast.success('Welcome to the Alumni community! 🎓');
    onComplete();
  };

  const resetModal = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={() => { resetModal(); onClose(); }}>
      <DialogContent className="max-w-md">
        {step === 'email' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Update Your Email
              </DialogTitle>
              <DialogDescription>
                Enter a personal (non-.edu) email to continue using Unigramm as an Alumni.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Personal Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button 
                onClick={handleSendOTP} 
                disabled={loading} 
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to {email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={otp} 
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading || otp.length < 6} 
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setStep('email')} 
                className="w-full"
              >
                Change email
              </Button>
            </div>
          </>
        )}

        {step === 'converting' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            <p className="text-lg font-medium">Converting to Alumni...</p>
            <p className="text-sm text-muted-foreground">Just a moment</p>
          </div>
        )}

        {step === 'complete' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">Welcome, Alumni! 🎓</h3>
              <p className="text-muted-foreground mt-2">
                Your account has been converted to Alumni status.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 w-full">
              <p className="text-sm text-center">
                <Award className="h-4 w-4 inline mr-1" />
                Want to become a <span className="font-semibold text-amber-600">Verified Alumni</span>? 
                Upload your degree or connect LinkedIn in Settings.
              </p>
            </div>
            <Button onClick={handleComplete} className="w-full">
              <GraduationCap className="h-4 w-4 mr-2" />
              Continue to Unigramm
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AlumniConversionModal;
