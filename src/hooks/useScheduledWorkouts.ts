
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduledWorkout {
  id: string;
  workout_time: string;
  workouts?: any;
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
        .select('*')
        .order('workout_time', { ascending: true });

      if (date) {
        query = query.gte('workout_time', `${date}T00:00:00.000Z`)
                     .lt('workout_time', `${date}T23:59:59.999Z`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      const transformedData = (data || []).map(item => ({
        id: item.id,
        workout_time: item.workout_time,
        workouts: null
      }));
      setScheduledWorkouts(transformedData);
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
          workout_time: `${date}T${time}:00.000Z`
        }])
        .select('*')
        .single();
        
      if (error) throw error;
      const transformedData = {
        id: data.id,
        workout_time: data.workout_time,
        workouts: null
      };
      setScheduledWorkouts(prev => [...prev, transformedData]);
      return transformedData;
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
