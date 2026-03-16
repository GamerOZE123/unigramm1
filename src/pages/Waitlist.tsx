import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import unigrammLogo from '@/assets/unigramm-logo.png';

const Waitlist: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for realtime changes to app_config
    const channel = supabase
      .channel('waitlist-access-check')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_config',
          filter: "key=eq.restricted_access",
        },
        (payload) => {
          const newValue = payload.new?.value;
          if (newValue === 'false') {
            navigate('/home', { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#080c17' }}
    >
      <div className="flex flex-col items-center text-center max-w-md space-y-6">
        <img src={unigrammLogo} alt="Unigramm" className="w-14 h-14 rounded-xl" />

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">You're on the list 🎉</h1>
          <p className="text-base text-gray-400">
            We'll email you at{' '}
            <span className="text-white font-medium">{user?.email}</span>{' '}
            once your access is approved. Hang tight!
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
};

export default Waitlist;
