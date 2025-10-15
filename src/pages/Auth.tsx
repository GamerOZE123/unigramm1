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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';
type UserType = 'student' | 'company';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<UserType>('student');
  const [universities, setUniversities] = useState<Array<{id: string, name: string}>>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    university: '',
    companyName: ''
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/home');
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        navigate('/home');
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: formData.name,
            university: userType === 'student' ? formData.university : undefined,
            company_name: userType === 'company' ? formData.companyName : undefined,
            username: formData.name || formData.email.split('@')[0],
            user_type: userType,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Check if profile needs completion
        const { data: profileData } = await supabase
          .from('profiles')
          .select('profile_completed')
          .eq('user_id', data.user.id)
          .single();

        if (profileData && !profileData.profile_completed) {
          setShowOnboarding(true);
        } else {
          setMessage('Account created successfully! Please check your email to confirm your account.');
          setMode('login');
        }
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
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      setMessage('Password reset email sent! Please check your inbox.');
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/home'), 2000);
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

  // Check for reset mode from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'reset') {
      setMode('reset');
    }
  }, []);

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
                  <RadioGroup value={userType} onValueChange={(value: UserType) => setUserType(value)} className="grid grid-cols-2 gap-4">
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
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{userType === 'student' ? 'Full Name' : 'Contact Person Name'}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder={userType === 'student' ? 'Enter your full name' : 'Enter contact person name'}
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
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 bg-surface border-border"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && userType === 'student' && (
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
