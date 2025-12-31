
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WorkoutSession {
  id: string;
  workout_name: string;
  duration_minutes: number;
  calories_burned?: number;
  workout_type?: string;
  notes?: string;
  created_at: string;
  user_id: string;
}

interface CreateWorkoutSessionData {
  workout_name: string;
  duration_minutes: number;
  calories_burned?: number;
  workout_type?: string;
  notes?: string;
}

export const useWorkoutSessions = () => {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const fetchWorkoutSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, workout_name, duration_minutes, calories_burned, workout_type, notes, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setWorkoutSessions(data || []);
    } catch (error) {
      console.error('Error fetching workout sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeWorkout = async (sessionData: CreateWorkoutSessionData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert([{
          ...sessionData,
          user_id: user.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      setWorkoutSessions(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    }
  };

  const deleteWorkoutSession = async (sessionId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) throw error;
      setWorkoutSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error deleting workout session:', error);
      throw error;
    }
  };

  const markWorkoutAsCompleted = (workoutId: string) => {
    setCompletedWorkouts(prev => new Set([...prev, workoutId]));
  };

  const isWorkoutCompleted = (workoutId: string) => {
    return completedWorkouts.has(workoutId);
  };

  useEffect(() => {
    fetchWorkoutSessions();
  }, [user]);

  return {
    workoutSessions,
    loading,
    completeWorkout,
    deleteWorkoutSession,
    fetchWorkoutSessions,
    markWorkoutAsCompleted,
    isWorkoutCompleted
  };
};
