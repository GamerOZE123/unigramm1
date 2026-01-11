import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GraduationEligibility {
  canGraduate: boolean;
  isFinalYear: boolean;
  graduationButtonEnabled: boolean;
  accountStatus: 'student' | 'alumni' | 'verified_alumni';
  academicYear: string | null;
  expectedGraduationYear: number | null;
  loading: boolean;
}

export const useGraduationEligibility = () => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<GraduationEligibility>({
    canGraduate: false,
    isFinalYear: false,
    graduationButtonEnabled: false,
    accountStatus: 'student',
    academicYear: null,
    expectedGraduationYear: null,
    loading: true,
  });

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        setEligibility(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Get user profile with course_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('academic_year, expected_graduation_year, account_status, university, course_id')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Determine if final year (includes common typos)
        const finalYears = ['4th Year', '4nd Year', '5th Year', 'Graduate', 'PhD', 'Final Year'];
        const isFinalYear = finalYears.includes(profile?.academic_year || '');

        // Check if university allows graduation button
        let graduationButtonEnabled = false;
        let forceEnableGraduation = false;

        if (profile?.university) {
          // Try matching by abbreviation first, then by name
          const { data: university } = await supabase
            .from('universities')
            .select('allow_graduation_button')
            .or(`abbreviation.eq.${profile.university},name.eq.${profile.university}`)
            .maybeSingle();

          graduationButtonEnabled = university?.allow_graduation_button || false;
        }

        // Check if course has force_enable_graduation flag
        if (profile?.course_id) {
          const { data: course } = await supabase
            .from('university_courses')
            .select('force_enable_graduation')
            .eq('id', profile.course_id)
            .maybeSingle();

          forceEnableGraduation = course?.force_enable_graduation || false;
        }

        // Can graduate if:
        // 1. Force enabled for this course, OR
        // 2. Final year AND university button enabled
        // AND still a student
        const canGraduate = 
          (forceEnableGraduation || (isFinalYear && graduationButtonEnabled)) && 
          (profile?.account_status === 'student' || !profile?.account_status);

        setEligibility({
          canGraduate,
          isFinalYear,
          graduationButtonEnabled: graduationButtonEnabled || forceEnableGraduation,
          accountStatus: (profile?.account_status as 'student' | 'alumni' | 'verified_alumni') || 'student',
          academicYear: profile?.academic_year || null,
          expectedGraduationYear: profile?.expected_graduation_year || null,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking graduation eligibility:', error);
        setEligibility(prev => ({ ...prev, loading: false }));
      }
    };

    checkEligibility();
  }, [user]);

  return eligibility;
};

export default useGraduationEligibility;
