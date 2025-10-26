import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CompanyOnboardingData {
  company_name: string;
  industry: string;
  company_size: string;
  headquarters: string;
  company_description: string;
  logo_url: string;
  website_url: string;
  subscription_id: string;
}

export const useCompanyOnboarding = () => {
  const { user, checkProfileCompletion } = useAuth();
  const [loading, setLoading] = useState(false);

  const saveCompanyProfile = async (data: CompanyOnboardingData) => {
    if (!user) {
      toast.error('No user found');
      return false;
    }

    setLoading(true);
    try {
      // Save company profile
      const { error: profileError } = await supabase
        .from('company_profiles')
        .insert({
          user_id: user.id,
          company_name: data.company_name,
          industry: data.industry,
          company_size: data.company_size,
          headquarters: data.headquarters,
          company_description: data.company_description,
          logo_url: data.logo_url,
          website_url: data.website_url,
        });

      if (profileError) throw profileError;

      // Get Free tier subscription ID if no subscription selected
      let subscriptionId = data.subscription_id;
      if (!subscriptionId) {
        const { data: freeTier, error: freeTierError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_type', 'company')
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
      toast.success('Company profile created successfully!');
      return true;
    } catch (error: any) {
      console.error('Error saving company profile:', error);
      toast.error(error.message || 'Failed to save company profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveCompanyProfile,
    loading,
  };
};
