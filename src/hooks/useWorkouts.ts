
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Workout {
  id: string;
  title: string;
  duration: number;
  difficulty: string;
  equipment: string;
  calories?: string;
  workout_type: string;
  created_at: string;
}

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWorkouts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWorkout = async (workoutData: {
    title: string;
    duration: number;
    difficulty: string;
    equipment: string;
    calories?: string;
    workout_type: string;
  }) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert([{
          ...workoutData,
          user_id: user.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      setWorkouts(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding workout:', error);
      throw error;
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);
        
      if (error) throw error;
      setWorkouts(prev => prev.filter(w => w.id !== workoutId));
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [user]);

  return {
    workouts,
    loading,
    addWorkout,
    deleteWorkout,
    fetchWorkouts
  };
};
