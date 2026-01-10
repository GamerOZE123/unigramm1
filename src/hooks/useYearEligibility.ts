import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface YearEligibility {
  canCompleteYear: boolean;
  currentYear: string | null;
  yearNumber: number | null;
  yearLabel: string | null;
  isGraduationYear: boolean;
  universityAllowsYearWrapped: boolean;
  loading: boolean;
}

const yearMapping: Record<string, { number: number; label: string; isGraduation: boolean }> = {
  '1st Year': { number: 1, label: '1st Year', isGraduation: false },
  '2nd Year': { number: 2, label: '2nd Year', isGraduation: false },
  '3rd Year': { number: 3, label: '3rd Year', isGraduation: false },
  '4th Year': { number: 4, label: '4th Year', isGraduation: true },
  '4nd Year': { number: 4, label: '4th Year', isGraduation: true }, // Handle typo
  '5th Year': { number: 5, label: '5th Year', isGraduation: true },
  'Graduate': { number: 6, label: 'Graduate', isGraduation: true },
  'PhD': { number: 7, label: 'PhD', isGraduation: true },
  'Final Year': { number: 4, label: 'Final Year', isGraduation: true },
};

export const useYearEligibility = () => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<YearEligibility>({
    canCompleteYear: false,
    currentYear: null,
    yearNumber: null,
    yearLabel: null,
    isGraduationYear: false,
    universityAllowsYearWrapped: false,
    loading: true,
  });

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        setEligibility(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('academic_year, account_status, university')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Don't show for alumni
        if (profile?.account_status === 'alumni' || profile?.account_status === 'verified_alumni') {
          setEligibility(prev => ({ ...prev, loading: false }));
          return;
        }

        const currentYear = profile?.academic_year || null;
        const yearInfo = currentYear ? yearMapping[currentYear] : null;

        // Check if university allows year wrapped (use graduation button setting for now)
        let universityAllowsYearWrapped = false;
        if (profile?.university) {
          const { data: university } = await supabase
            .from('universities')
            .select('allow_graduation_button')
            .or(`abbreviation.eq.${profile.university},name.eq.${profile.university}`)
            .maybeSingle();

          universityAllowsYearWrapped = university?.allow_graduation_button || false;
        }

        setEligibility({
          canCompleteYear: !!yearInfo && universityAllowsYearWrapped,
          currentYear,
          yearNumber: yearInfo?.number || null,
          yearLabel: yearInfo?.label || currentYear,
          isGraduationYear: yearInfo?.isGraduation || false,
          universityAllowsYearWrapped,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking year eligibility:', error);
        setEligibility(prev => ({ ...prev, loading: false }));
      }
    };

    checkEligibility();
  }, [user]);

  return eligibility;
};

export default useYearEligibility;
