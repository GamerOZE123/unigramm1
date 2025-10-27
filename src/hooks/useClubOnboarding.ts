import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ClubOnboardingData {
  club_name: string;
  club_description: string;
  logo_url?: string;
  category?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
}

export const useClubOnboarding = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const saveClubProfile = async (data: ClubOnboardingData): Promise<boolean> => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }

    setLoading(true);
    try {
      // Get user's university from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();

      // Save club profile
      const { error: profileError } = await supabase
        .from('clubs_profiles')
        .upsert({
          user_id: user.id,
          club_name: data.club_name,
          club_description: data.club_description,
          logo_url: data.logo_url || '',
          category: data.category || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          website_url: data.website_url || '',
          university: profileData?.university || ''
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Mark profile as completed
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_completed: true })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Club profile created successfully!');
      return true;
    } catch (error: any) {
      console.error('Error saving club profile:', error);
      toast.error(error.message || 'Failed to save club profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { saveClubProfile, loading };
};
