
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduledWorkout {
  id: string;
  workout_id: string;
  scheduled_time: string;
  scheduled_date: string;
  created_at: string;
  workouts: {
    title: string;
    duration: number;
    difficulty: string;
    equipment: string;
    calories?: string;
    workout_type: string;
  };
}

export const useScheduledWorkouts = () => {
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchScheduledWorkouts = async (date?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('scheduled_workouts')
        .select(`
          *,
          workouts (
            title,
            duration,
            difficulty,
            equipment,
            calories,
            workout_type
          )
        `)
        .order('scheduled_time', { ascending: true });

      if (date) {
        query = query.eq('scheduled_date', date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setScheduledWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching scheduled workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addScheduledWorkout = async (workoutId: string, time: string, date: string = new Date().toISOString().split('T')[0]) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .insert([{
          workout_id: workoutId,
          scheduled_time: time,
          scheduled_date: date,
          user_id: user.id
        }])
        .select(`
          *,
          workouts (
            title,
            duration,
            difficulty,
            equipment,
            calories,
            workout_type
          )
        `)
        .single();
        
      if (error) throw error;
      setScheduledWorkouts(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding scheduled workout:', error);
      throw error;
    }
  };

  const deleteScheduledWorkout = async (scheduledWorkoutId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .delete()
        .eq('id', scheduledWorkoutId);
        
      if (error) throw error;
      setScheduledWorkouts(prev => prev.filter(sw => sw.id !== scheduledWorkoutId));
    } catch (error) {
      console.error('Error deleting scheduled workout:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchScheduledWorkouts();
  }, [user]);

  return {
    scheduledWorkouts,
    loading,
    addScheduledWorkout,
    deleteScheduledWorkout,
    fetchScheduledWorkouts
  };
};
