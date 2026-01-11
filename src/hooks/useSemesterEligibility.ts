import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SemesterEligibility {
  canCompleteSemester: boolean;
  currentSemester: 'fall' | 'spring' | null;
  semesterNumber: number | null; // 1-8 for 4-year, calculated from start year
  semesterLabel: string | null;
  academicYear: string | null;
  yearNumber: number | null;
  universityAllowsSemesterWrapped: boolean;
  loading: boolean;
}

const yearMapping: Record<string, number> = {
  '1st Year': 1,
  '2nd Year': 2,
  '3rd Year': 3,
  '4th Year': 4,
  '4nd Year': 4,
  '5th Year': 5,
  'Graduate': 6,
  'PhD': 7,
  'Final Year': 4,
};

export const useSemesterEligibility = () => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<SemesterEligibility>({
    canCompleteSemester: false,
    currentSemester: null,
    semesterNumber: null,
    semesterLabel: null,
    academicYear: null,
    yearNumber: null,
    universityAllowsSemesterWrapped: false,
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
          .select('academic_year, account_status, university, start_year, expected_graduation_year')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Don't show for alumni
        if (profile?.account_status === 'alumni' || profile?.account_status === 'verified_alumni') {
          setEligibility(prev => ({ ...prev, loading: false }));
          return;
        }

        const academicYear = profile?.academic_year || null;
        const yearNumber = academicYear ? yearMapping[academicYear] : null;
        const startYear = profile?.start_year;

        // Calculate current semester based on year and current month
        // Academic calendar:
        // - Fall/Monsoon semester: July (7) to December (12)
        // - Spring semester: January (1) to May (5)
        // - June is typically a break month
        let currentSemester: 'fall' | 'spring' | null = null;
        let semesterNumber: number | null = null;
        let semesterLabel: string | null = null;

        if (yearNumber && startYear) {
          const currentMonth = new Date().getMonth() + 1; // 1-12
          
          // Determine current semester based on month
          // Fall: July (7) - December (12)
          // Spring: January (1) - May (5)
          // June (6) is break - show as preparing for next fall
          if (currentMonth >= 7 && currentMonth <= 12) {
            currentSemester = 'fall';
            // Fall is the first semester of the academic year
            semesterNumber = (yearNumber - 1) * 2 + 1;
            semesterLabel = `${academicYear} - Fall Semester`;
          } else if (currentMonth >= 1 && currentMonth <= 5) {
            currentSemester = 'spring';
            // Spring is the second semester of the academic year
            semesterNumber = (yearNumber - 1) * 2 + 2;
            semesterLabel = `${academicYear} - Spring Semester`;
          } else {
            // June - break month, prepare for next fall
            currentSemester = 'fall';
            semesterNumber = (yearNumber - 1) * 2 + 1;
            semesterLabel = `${academicYear} - Fall Semester (Upcoming)`;
          }
        }

        // Check if university allows semester wrapped (use graduation button setting)
        let universityAllowsSemesterWrapped = false;
        if (profile?.university) {
          const { data: university } = await supabase
            .from('universities')
            .select('allow_graduation_button')
            .or(`abbreviation.eq.${profile.university},name.eq.${profile.university}`)
            .maybeSingle();

          universityAllowsSemesterWrapped = university?.allow_graduation_button || false;
        }

        setEligibility({
          canCompleteSemester: !!semesterNumber && universityAllowsSemesterWrapped,
          currentSemester,
          semesterNumber,
          semesterLabel,
          academicYear,
          yearNumber,
          universityAllowsSemesterWrapped,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking semester eligibility:', error);
        setEligibility(prev => ({ ...prev, loading: false }));
      }
    };

    checkEligibility();
  }, [user]);

  return eligibility;
};

export default useSemesterEligibility;
