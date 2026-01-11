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

        // Calculate current semester based on year and which semester they're in
        // Each year has 2 semesters: Fall (1st) and Spring (2nd)
        let currentSemester: 'fall' | 'spring' | null = null;
        let semesterNumber: number | null = null;
        let semesterLabel: string | null = null;

        if (yearNumber && startYear) {
          // Calculate total semesters: (yearNumber - 1) * 2 + current semester
          // Semester 1 = Year 1 Fall, Semester 2 = Year 1 Spring, etc.
          
          // For simplicity, we assume:
          // - Fall semester: Semesters 1, 3, 5, 7... (odd)
          // - Spring semester: Semesters 2, 4, 6, 8... (even)
          // Users manually complete each semester
          
          // Default to fall semester for each year if not tracked
          // We'll need to track completed semesters separately
          currentSemester = 'fall';
          semesterNumber = (yearNumber - 1) * 2 + 1; // Start with fall semester
          semesterLabel = `${academicYear} - Fall Semester`;
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
