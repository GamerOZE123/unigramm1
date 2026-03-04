
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileCompleted: boolean;
  userType: string | null;
  signOut: () => Promise<void>;
  checkProfileCompletion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  const checkAndCancelPendingDeletion = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('deletion_scheduled_at, deactivated_at')
        .eq('user_id', userId)
        .single();

      if (data?.deletion_scheduled_at && data?.deactivated_at) {
        // Auto-cancel deletion on login
        const { error } = await supabase.functions.invoke('delete-account', {
          body: { action: 'cancel' },
        });
        if (!error) {
          toast.success('Welcome back! Your account deletion has been cancelled.', {
            duration: 6000,
          });
        }
      }
    } catch (err) {
      console.error('Error checking pending deletion:', err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // On sign-in, check for pending deletion
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => checkAndCancelPendingDeletion(session.user.id), 1000);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfileCompletion = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('profile_completed, user_type')
      .eq('user_id', user.id)
      .single();
    
    setProfileCompleted(data?.profile_completed || false);
    setUserType(data?.user_type || null);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    }
  }, [user]);

  const value = {
    user,
    session,
    loading,
    profileCompleted,
    userType,
    signOut,
    checkProfileCompletion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
