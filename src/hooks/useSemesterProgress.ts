import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CompletedSemester {
  id?: string;
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
  firstSemesterNumber: number; // The semester number when user joined
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
    firstSemesterNumber: 1,
  });

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Get user profile to determine current year and account creation date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('academic_year, start_year, expected_graduation_year, created_at')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const startYear = profile?.start_year;
      const expectedGradYear = profile?.expected_graduation_year;
      const accountCreatedAt = profile?.created_at ? new Date(profile.created_at) : new Date();

      // Calculate total semesters based on expected program length
      const programYears = expectedGradYear && startYear 
        ? expectedGradYear - startYear 
        : 4;
      const totalSemesters = programYears * 2;

      // Get completed semesters from Supabase
      const { data: completionsData, error: completionsError } = await supabase
        .from('semester_completions')
        .select('id, semester_number, semester_type, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (completionsError) {
        console.error('Error fetching semester completions:', completionsError);
      }

      const completedSemesters: CompletedSemester[] = (completionsData || []).map(c => ({
        id: c.id,
        semesterNumber: c.semester_number,
        completedAt: c.completed_at,
        semesterType: c.semester_type as 'fall' | 'spring',
      }));

      // Determine the first semester the user should track based on account creation
      const accountCreationMonth = accountCreatedAt.getMonth() + 1; // 1-12
      const accountCreationYear = accountCreatedAt.getFullYear();
      
      // Determine which academic year the account was created in
      // Fall (July-Dec): academic year starts that year
      // Spring (Jan-May): academic year started previous year
      const accountAcademicStartYear = accountCreationMonth >= 7 ? accountCreationYear : accountCreationYear - 1;
      
      // Determine which semester the user started with
      const accountStartSemesterType: 'fall' | 'spring' = accountCreationMonth >= 7 || accountCreationMonth <= 5 
        ? (accountCreationMonth >= 7 ? 'fall' : 'spring') 
        : 'fall'; // June defaults to fall (upcoming)
      
      // Calculate the user's starting semester number based on their start_year
      let firstSemesterNumber = 1;
      if (startYear) {
        const yearsFromStart = accountAcademicStartYear - startYear;
        const yearNumber = Math.max(1, yearsFromStart + 1);
        firstSemesterNumber = (yearNumber - 1) * 2 + (accountStartSemesterType === 'fall' ? 1 : 2);
      }

      // Calculate current semester based on current date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Determine current academic year
      const currentAcademicStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
      
      let currentSemester: 'fall' | 'spring' = 'fall';
      let semesterNumber = 1;
      
      if (startYear) {
        const yearsFromStart = currentAcademicStartYear - startYear;
        const calculatedYearNumber = Math.max(1, yearsFromStart + 1);
        
        if (currentMonth >= 7 && currentMonth <= 12) {
          currentSemester = 'fall';
          semesterNumber = (calculatedYearNumber - 1) * 2 + 1;
        } else if (currentMonth >= 1 && currentMonth <= 5) {
          currentSemester = 'spring';
          semesterNumber = (calculatedYearNumber - 1) * 2 + 2;
        } else {
          // June - prepare for next fall
          currentSemester = 'fall';
          semesterNumber = calculatedYearNumber * 2 + 1;
        }
      }
      
      // Ensure we don't track semesters before the user joined
      if (semesterNumber < firstSemesterNumber) {
        semesterNumber = firstSemesterNumber;
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

      // Determine the next semester to complete
      // Find all semesters from firstSemesterNumber up to current semesterNumber
      // and find the first one that hasn't been completed
      let nextSemesterToComplete = semesterNumber;
      let nextSemesterType = currentSemester;
      
      for (let sem = firstSemesterNumber; sem <= semesterNumber; sem++) {
        const isCompleted = completedSemesters.some(c => c.semesterNumber === sem);
        if (!isCompleted) {
          nextSemesterToComplete = sem;
          // Odd semesters are fall, even are spring
          nextSemesterType = sem % 2 === 1 ? 'fall' : 'spring';
          break;
        }
      }

      setProgress({
        currentSemester: nextSemesterType,
        completedSemesters,
        totalSemesters,
        semesterNumber: nextSemesterToComplete,
        loading: false,
        cooldownActive,
        cooldownEndsAt,
        lastCompletedSemester: lastCompleted,
        firstSemesterNumber,
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

    try {
      // Check if already completed
      const { data: existing } = await supabase
        .from('semester_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('semester_number', semesterNumber)
        .maybeSingle();

      if (!existing) {
        // Insert new completion
        const { error } = await supabase
          .from('semester_completions')
          .insert({
            user_id: user.id,
            semester_number: semesterNumber,
            semester_type: semesterType,
          });

        if (error) {
          console.error('Error completing semester:', error);
          return;
        }
      }

      // Refresh progress
      await fetchProgress();
    } catch (error) {
      console.error('Error completing semester:', error);
    }
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
