import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProfileCompletionData {
  major: string;
  interests: string[];
  preferred_event_types: string[];
  status_message: string;
  linkedin_url: string;
  instagram_url: string;
  twitter_url: string;
  website_url: string;
  campus_groups: string[];
  avatar_url: string;
  banner_url: string;
}

export const useProfileCompletion = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileCompletionData>({
    major: '',
    interests: [],
    preferred_event_types: [],
    status_message: '',
    linkedin_url: '',
    instagram_url: '',
    twitter_url: '',
    website_url: '',
    campus_groups: [],
    avatar_url: '',
    banner_url: ''
  });

  const saveStep = async (stepData: Partial<ProfileCompletionData>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update(stepData)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setFormData(prev => ({ ...prev, ...stepData }));
    } catch (error) {
      console.error('Error saving step:', error);
      toast.error('Failed to save your information');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          profile_completed: true,
          profile_completion_date: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 8));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const skipStep = () => nextStep();

  return {
    currentStep,
    formData,
    setFormData,
    saveStep,
    completeOnboarding,
    nextStep,
    prevStep,
    skipStep,
    loading
  };
};
