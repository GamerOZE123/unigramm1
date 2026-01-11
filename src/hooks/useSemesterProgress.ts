import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CompletedSemester {
  semesterNumber: number;
  completedAt: string; // ISO date string
  semesterType: 'fall' | 'spring';
}

interface SemesterProgress {
  currentSemester: 'fall' | 'spring';
  completedSemesters: CompletedSemester[];
  totalSemesters: number;
  semesterNumber: number;
  loading: boolean;
  cooldownActive: boolean;
  cooldownEndsAt: Date | null;
  lastCompletedSemester: CompletedSemester | null;
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

const COOLDOWN_MONTHS = 4; // 4-5 months cooldown

export const useSemesterProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<SemesterProgress>({
    currentSemester: 'fall',
    completedSemesters: [],
    totalSemesters: 8,
    semesterNumber: 1,
    loading: true,
    cooldownActive: false,
    cooldownEndsAt: null,
    lastCompletedSemester: null,
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

      // Get completed semesters from local storage
      const storageKey = `semester_progress_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      const completedSemesters: CompletedSemester[] = stored ? JSON.parse(stored) : [];

      // Calculate current semester based on year and completed semesters
      const fallSemester = (yearNumber - 1) * 2 + 1;
      const springSemester = fallSemester + 1;

      const fallCompleted = completedSemesters.find(s => s.semesterNumber === fallSemester);
      const springCompleted = completedSemesters.find(s => s.semesterNumber === springSemester);

      let currentSemester: 'fall' | 'spring' = 'fall';
      let semesterNumber = fallSemester;

      if (fallCompleted && !springCompleted) {
        currentSemester = 'spring';
        semesterNumber = springSemester;
      } else if (!fallCompleted) {
        currentSemester = 'fall';
        semesterNumber = fallSemester;
      }

      // Check cooldown - last completed semester
      const sortedCompleted = [...completedSemesters].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      const lastCompleted = sortedCompleted[0] || null;

      let cooldownActive = false;
      let cooldownEndsAt: Date | null = null;

      if (lastCompleted) {
        const completedDate = new Date(lastCompleted.completedAt);
        const cooldownEnd = new Date(completedDate);
        cooldownEnd.setMonth(cooldownEnd.getMonth() + COOLDOWN_MONTHS);
        
        if (new Date() < cooldownEnd) {
          cooldownActive = true;
          cooldownEndsAt = cooldownEnd;
        }
      }

      setProgress({
        currentSemester,
        completedSemesters,
        totalSemesters,
        semesterNumber,
        loading: false,
        cooldownActive,
        cooldownEndsAt,
        lastCompletedSemester: lastCompleted,
      });
    } catch (error) {
      console.error('Error fetching semester progress:', error);
      setProgress(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const completeSemester = useCallback(async (semesterNumber: number, semesterType: 'fall' | 'spring') => {
    if (!user) return;

    const storageKey = `semester_progress_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    const completedSemesters: CompletedSemester[] = stored ? JSON.parse(stored) : [];

    // Check if already completed
    if (!completedSemesters.find(s => s.semesterNumber === semesterNumber)) {
      const newCompletion: CompletedSemester = {
        semesterNumber,
        completedAt: new Date().toISOString(),
        semesterType,
      };
      completedSemesters.push(newCompletion);
      localStorage.setItem(storageKey, JSON.stringify(completedSemesters));
    }

    // Refresh progress
    await fetchProgress();
  }, [user, fetchProgress]);

  const getCompletedSemesterByNumber = useCallback((semNum: number): CompletedSemester | undefined => {
    return progress.completedSemesters.find(s => s.semesterNumber === semNum);
  }, [progress.completedSemesters]);

  return { 
    ...progress, 
    completeSemester, 
    refetch: fetchProgress,
    getCompletedSemesterByNumber,
  };
};

export default useSemesterProgress;
