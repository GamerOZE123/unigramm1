import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SemesterProgress {
  currentSemester: 'fall' | 'spring';
  completedSemesters: number[]; // Array of completed semester numbers
  totalSemesters: number; // Total semesters based on program duration
  semesterNumber: number; // Current semester number (1-8 for 4-year)
  loading: boolean;
}

const yearToNumber: Record<string, number> = {
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

export const useSemesterProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<SemesterProgress>({
    currentSemester: 'fall',
    completedSemesters: [],
    totalSemesters: 8,
    semesterNumber: 1,
    loading: true,
  });

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Get user profile to determine current year
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('academic_year, start_year, expected_graduation_year')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const academicYear = profile?.academic_year;
      const startYear = profile?.start_year;
      const expectedGradYear = profile?.expected_graduation_year;
      const yearNumber = academicYear ? yearToNumber[academicYear] : 1;

      // Calculate total semesters based on expected program length
      const programYears = expectedGradYear && startYear 
        ? expectedGradYear - startYear 
        : 4;
      const totalSemesters = programYears * 2;

      // Get completed semesters from local storage for now
      // In production, this should be stored in the database
      const storageKey = `semester_progress_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      const completedSemesters: number[] = stored ? JSON.parse(stored) : [];

      // Calculate current semester based on year and completed semesters
      // Each year has 2 semesters: odd = fall, even = spring
      const fallSemester = (yearNumber - 1) * 2 + 1;
      const springSemester = fallSemester + 1;

      const fallCompleted = completedSemesters.includes(fallSemester);
      const springCompleted = completedSemesters.includes(springSemester);

      let currentSemester: 'fall' | 'spring' = 'fall';
      let semesterNumber = fallSemester;

      if (fallCompleted && !springCompleted) {
        currentSemester = 'spring';
        semesterNumber = springSemester;
      } else if (!fallCompleted) {
        currentSemester = 'fall';
        semesterNumber = fallSemester;
      }

      setProgress({
        currentSemester,
        completedSemesters,
        totalSemesters,
        semesterNumber,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching semester progress:', error);
      setProgress(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const completeSemester = useCallback(async (semesterNumber: number) => {
    if (!user) return;

    const storageKey = `semester_progress_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    const completedSemesters: number[] = stored ? JSON.parse(stored) : [];

    if (!completedSemesters.includes(semesterNumber)) {
      completedSemesters.push(semesterNumber);
      localStorage.setItem(storageKey, JSON.stringify(completedSemesters));
    }

    // Refresh progress
    await fetchProgress();
  }, [user, fetchProgress]);

  return { ...progress, completeSemester, refetch: fetchProgress };
};

export default useSemesterProgress;
