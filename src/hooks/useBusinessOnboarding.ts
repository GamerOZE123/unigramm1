import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BusinessOnboardingData {
  business_name: string;
  industry: string;
  business_size: string;
  headquarters: string;
  business_description: string;
  logo_url: string;
  website_url: string;
  subscription_id: string;
}

export const useBusinessOnboarding = () => {
  const { user, checkProfileCompletion } = useAuth();
  const [loading, setLoading] = useState(false);

  const saveBusinessProfile = async (data: BusinessOnboardingData) => {
    if (!user) {
      toast.error('No user found');
      return false;
    }

    setLoading(true);
    try {
      // Save business profile (upsert to handle existing profiles)
      const { error: profileError } = await supabase
        .from('business_profiles')
        .upsert({
          user_id: user.id,
          business_name: data.business_name,
          industry: data.industry,
          business_size: data.business_size,
          headquarters: data.headquarters,
          business_description: data.business_description,
          logo_url: data.logo_url,
          website_url: data.website_url,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Get Free tier subscription ID if no subscription selected
      let subscriptionId = data.subscription_id;
      if (!subscriptionId) {
        const { data: freeTier, error: freeTierError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_type', 'business')
          .eq('name', 'Free')
          .single();

        if (freeTierError) throw freeTierError;
        subscriptionId = freeTier.id;
      }

      // Create user subscription
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          subscription_id: subscriptionId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          auto_renew: true,
        });

      if (subscriptionError) throw subscriptionError;

      // Mark profile as completed
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_completed: true })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await checkProfileCompletion();
      toast.success('Business profile created successfully!');
      return true;
    } catch (error: any) {
      console.error('Error saving business profile:', error);
      toast.error(error.message || 'Failed to save business profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveBusinessProfile,
    loading,
  };
};
