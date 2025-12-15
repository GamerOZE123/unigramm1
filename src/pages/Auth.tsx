import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, Mail, Lock, User, ArrowLeft, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ProfileCompletionFlow } from '@/components/auth/ProfileCompletionFlow';
import CompanyOnboardingFlow from '@/components/auth/CompanyOnboardingFlow';
import ClubOnboardingFlow from '@/components/auth/ClubOnboardingFlow';
import { signUpSchema, signInSchema, resetPasswordSchema } from '@/lib/validation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';
type UserType = 'student' | 'company' | 'clubs';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<UserType>('student');
  const [universities, setUniversities] = useState<Array<{id: string, name: string}>>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCompanyOnboarding, setShowCompanyOnboarding] = useState(false);
  const [showClubOnboarding, setShowClubOnboarding] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    university: '',
    companyName: ''
  });

  // Check if user is already logged in (but not in password recovery)
  useEffect(() => {
    const checkUser = async () => {
      // Check if this is a password recovery flow by looking at URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const isRecovery = hashParams.get('type') === 'recovery';
      
      if (!isRecovery) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          navigate('/home');
        }
      }
    };
    checkUser();

    // Fetch universities
    const fetchUniversities = async () => {
      const { data } = await supabase
        .from('universities')
        .select('id, name')
        .order('name');
      if (data) setUniversities(data);
    };
    fetchUniversities();
  }, [navigate]);

  const detectUniversityFromEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain?.includes('.snu')) {
      return 'Shiv Nadar University';
    }
    // Add more university mappings here
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-detect university when email changes
    if (name === 'email' && userType === 'student') {
      const detectedUniversity = detectUniversityFromEmail(value);
      setFormData({
        ...formData,
        [name]: value,
        university: detectedUniversity || formData.university
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    setError('');
    setMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if input is email or username
      const isEmail = formData.email.includes('@');
      let emailToUse = formData.email;

      // If it's a username, look up the email
      if (!isEmail) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', formData.email)
          .single();

        if (profileError || !profile?.email) {
          setError('Username not found');
          setLoading(false);
          return;
        }
        emailToUse = profile.email;
      }

      // Validate input
      const validationResult = signInSchema.safeParse({
        email: emailToUse,
        password: formData.password
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user's location and update profile
        try {
          const locationResponse = await fetch('https://ipapi.co/json/');
          const locationData = await locationResponse.json();
          
          if (locationData.country_name && locationData.region && locationData.city) {
            await supabase
              .from('profiles')
              .update({
                country: locationData.country_name,
                state: locationData.region,
                area: locationData.city
              })
              .eq('user_id', data.user.id);
          }
        } catch (locationError) {
          console.error('Failed to fetch location:', locationError);
          // Continue login even if location fetch fails
        }

        // Check if profile needs completion on first login
        const { data: profileData } = await supabase
          .from('profiles')
          .select('profile_completed, user_type')
          .eq('user_id', data.user.id)
          .single();

        if (profileData && !profileData.profile_completed) {
          // Show appropriate onboarding based on user type
          if (profileData.user_type === 'company') {
            setShowCompanyOnboarding(true);
          } else if (profileData.user_type === 'clubs') {
            setShowClubOnboarding(true);
          } else {
            setShowOnboarding(true);
          }
        } else {
          navigate('/home');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Validate input
      const validationResult = signUpSchema.safeParse({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        fullName: formData.name,
        username: formData.name || formData.email.split('@')[0]
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: validationResult.data.email,
        password: validationResult.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: validationResult.data.fullName,
            university: (userType === 'student' || userType === 'clubs') ? formData.university : undefined,
            company_name: userType === 'company' ? formData.companyName : undefined,
            club_name: userType === 'clubs' ? validationResult.data.fullName : undefined,
            username: validationResult.data.username,
            user_type: userType,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setMessage('Account created successfully! Please check your email to confirm your account.');
        setMode('login');
      }
    } catch (error: any) {
      setError(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      setMessage('Password reset email sent! Please check your inbox and click the link to reset your password.');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate input
      const validationResult = resetPasswordSchema.safeParse({
        password: formData.password
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid password';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: validationResult.data.password
      });

      if (error) throw error;

      setMessage('Password updated successfully! You can now login with your new password.');
      setMode('login');
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    switch (mode) {
      case 'login':
        return handleLogin(e);
      case 'signup':
        return handleSignup(e);
      case 'forgot':
        return handleForgotPassword(e);
      case 'reset':
        return handleResetPassword(e);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';
      case 'signup':
        return 'Create Account';
      case 'forgot':
        return 'Forgot Password';
      case 'reset':
        return 'Reset Password';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to your account to continue';
      case 'signup':
        return 'Join your university\'s social network';
      case 'forgot':
        return 'Enter your email to receive a password reset link';
      case 'reset':
        return 'Enter your new password';
    }
  };

  // Handle password recovery from email link
  useEffect(() => {
    // Use a ref-like variable to track recovery state across the effect
    let isRecoveryFlow = false;

    // Check URL hash for recovery token on mount
    const checkForRecovery = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      // Check for recovery flow
      if (type === 'recovery' && accessToken) {
        isRecoveryFlow = true;
        setMode('reset');
        setMessage('Please enter your new password below.');
        
        // Set the session from the URL tokens
        if (refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
        return;
      }
      
      // Also check for error in URL (e.g., expired link)
      const errorDescription = hashParams.get('error_description');
      if (errorDescription) {
        setError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
        setMode('forgot');
      }
    };

    checkForRecovery();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle PASSWORD_RECOVERY event
      if (event === 'PASSWORD_RECOVERY') {
        isRecoveryFlow = true;
        setMode('reset');
        setMessage('Please enter your new password below.');
        return;
      }
      
      // Skip redirect logic if we're in recovery flow
      if (isRecoveryFlow) {
        return;
      }
      
      // Check URL hash again for recovery (in case of race condition)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const isRecoveryInUrl = hashParams.get('type') === 'recovery';
      
      if (isRecoveryInUrl) {
        setMode('reset');
        setMessage('Please enter your new password below.');
        return;
      }
      
      // Only handle SIGNED_IN if not in password recovery mode
      if (event === 'SIGNED_IN' && session) {
        // Use setTimeout to defer database calls
        setTimeout(async () => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('profile_completed, user_type')
            .eq('user_id', session.user.id)
            .single();

          if (profileData && !profileData.profile_completed) {
            if (profileData.user_type === 'company') {
              setShowCompanyOnboarding(true);
            } else if (profileData.user_type === 'clubs') {
              setShowClubOnboarding(true);
            } else {
              setShowOnboarding(true);
            }
          } else {
            navigate('/home');
          }
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <>
      <ProfileCompletionFlow 
        open={showOnboarding} 
        onComplete={() => {
          setShowOnboarding(false);
          setMessage('Welcome to Unigramm! Please check your email to confirm your account.');
          setMode('login');
        }} 
      />

      {showCompanyOnboarding && <CompanyOnboardingFlow />}
      {showClubOnboarding && <ClubOnboardingFlow />}
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 university-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Unigramm
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect with your university community
          </p>
        </div>

        {/* Auth Form */}
        <div className="post-card">
          {mode !== 'login' && mode !== 'signup' && (
            <button
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {getTitle()}
            </h2>
            <p className="text-muted-foreground">
              {getDescription()}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-4 border-green-500 text-green-700">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <>
                <div className="space-y-4">
                  <Label>I am a:</Label>
                  <RadioGroup value={userType} onValueChange={(value: UserType) => setUserType(value)} className="grid grid-cols-3 gap-4">
                    <div className="flex items-center p-4 border rounded-md cursor-pointer transition-colors hover:bg-muted/50 data-[state=checked]:bg-muted" data-state={userType === 'student' ? 'checked' : 'unchecked'}>
                      <RadioGroupItem value="student" id="student" className="sr-only" />
                      <Label htmlFor="student" className="flex flex-col items-center gap-2 w-full cursor-pointer">
                        <GraduationCap className="w-6 h-6 text-primary" />
                        <span className="font-medium text-center">Student</span>
                      </Label>
                    </div>
                    <div className="flex items-center p-4 border rounded-md cursor-pointer transition-colors hover:bg-muted/50 data-[state=checked]:bg-muted" data-state={userType === 'company' ? 'checked' : 'unchecked'}>
                      <RadioGroupItem value="company" id="company" className="sr-only" />
                      <Label htmlFor="company" className="flex flex-col items-center gap-2 w-full cursor-pointer">
                        <Building2 className="w-6 h-6 text-primary" />
                        <span className="font-medium text-center">Company</span>
                      </Label>
                    </div>
                    <div className="flex items-center p-4 border rounded-md cursor-pointer transition-colors hover:bg-muted/50 data-[state=checked]:bg-muted" data-state={userType === 'clubs' ? 'checked' : 'unchecked'}>
                      <RadioGroupItem value="clubs" id="clubs" className="sr-only" />
                      <Label htmlFor="clubs" className="flex flex-col items-center gap-2 w-full cursor-pointer">
                        <User className="w-6 h-6 text-primary" />
                        <span className="font-medium text-center">Club</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {userType === 'student' ? 'Full Name' : userType === 'clubs' ? 'Club Name' : 'Contact Person Name'}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={userType === 'student' ? 'Enter your full name' : userType === 'clubs' ? 'Enter your club name' : 'Enter contact person name'}
                        className="pl-10 bg-surface border-border"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {userType === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="companyName"
                          name="companyName"
                          type="text"
                          placeholder="Enter your company name"
                          className="pl-10 bg-surface border-border"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div className="space-y-2">
                <Label htmlFor="email">{mode === 'login' ? 'Email or Username' : 'Email'}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type={mode === 'login' ? 'text' : 'email'}
                    placeholder={mode === 'login' ? 'Enter your email or username' : 'Enter your email'}
                    className="pl-10 bg-surface border-border"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (userType === 'student' || userType === 'clubs') && (
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10 pointer-events-none" />
                  <Select
                    value={formData.university}
                    onValueChange={(value) => setFormData({...formData, university: value})}
                    required
                  >
                    <SelectTrigger className="pl-10 bg-surface border-border">
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50">
                      {universities.map(uni => (
                        <SelectItem key={uni.id} value={uni.name}>
                          {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 bg-surface border-border"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10 bg-surface border-border"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full btn-primary mt-6" disabled={loading}>
              {loading ? 'Loading...' : getTitle()}
            </Button>
          </form>

          {mode === 'login' && (
            <>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Don't have an account? Sign up
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
    </>
  );
}
