
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FitnessChallenge {
  id: string;
  title: string;
  description?: string;
  challenge_type: string;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_participants?: number;
  prize_description?: string;
  creator_id: string;
  created_at: string;
  participant_count?: number;
}

interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  current_progress: number;
  joined_at: string;
}

export const useFitnessChallenges = () => {
  const [challenges, setChallenges] = useState<FitnessChallenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<ChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fitness_challenges')
        .select('id, title, description, challenge_type, target_value, target_unit, start_date, end_date, is_active, max_participants, prize_description, creator_id, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Get participant counts for each challenge
      const challengesWithCounts = await Promise.all(
        (data || []).map(async (challenge) => {
          const { data: countData } = await supabase
            .rpc('get_challenge_participant_count', { challenge_uuid: challenge.id });
          
          return {
            ...challenge,
            participant_count: countData || 0
          };
        })
      );
      
      setChallenges(challengesWithCounts);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChallenges = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('id, challenge_id, user_id, current_progress, joined_at')
        .eq('user_id', user.id)
        .limit(50);
      
      if (error) throw error;
      setUserChallenges(data || []);
    } catch (error) {
      console.error('Error fetching user challenges:', error);
    }
  };

  const createChallenge = async (challengeData: Omit<FitnessChallenge, 'id' | 'creator_id' | 'created_at' | 'participant_count'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('fitness_challenges')
        .insert([{
          ...challengeData,
          creator_id: user.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      setChallenges(prev => [{ ...data, participant_count: 0 }, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .insert([{
          challenge_id: challengeId,
          user_id: user.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      setUserChallenges(prev => [...prev, data]);
      
      // Update the challenge participant count
      setChallenges(prev => prev.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, participant_count: (challenge.participant_count || 0) + 1 }
          : challenge
      ));
      
      return data;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  };

  const recordProgress = async (challengeId: string, progressValue: number, notes?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('challenge_progress')
        .insert([{
          challenge_id: challengeId,
          user_id: user.id,
          progress_value: progressValue,
          notes
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording progress:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchUserChallenges();
  }, [user]);

  return {
    challenges,
    userChallenges,
    loading,
    createChallenge,
    joinChallenge,
    recordProgress,
    fetchChallenges
  };
};
