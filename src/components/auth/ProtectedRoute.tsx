
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [accessState, setAccessState] = useState<'loading' | 'allowed' | 'waitlist'>('loading');

  useEffect(() => {
    if (!user) {
      setAccessState('allowed'); // will redirect to "/" below anyway
      return;
    }

    const checkAccess = async () => {
      const [configResult, profileResult] = await Promise.all([
        supabase
          .from('app_config')
          .select('value')
          .eq('key', 'restricted_access')
          .single(),
        supabase
          .from('profiles')
          .select('approved')
          .eq('user_id', user.id)
          .single(),
      ]);

      const restricted = configResult.data?.value === 'true';
      const approved = profileResult.data?.approved ?? false;

      if (!restricted || approved) {
        setAccessState('allowed');
      } else {
        setAccessState('waitlist');
      }
    };

    checkAccess();
  }, [user]);

  if (loading || (user && accessState === 'loading')) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (accessState === 'waitlist') {
    return <Navigate to="/waitlist" replace />;
  }

  return <>{children}</>;
};
