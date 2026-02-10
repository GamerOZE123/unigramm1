import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DatingCandidate {
  user_id: string;
  bio: string | null;
  gender: string | null;
  interested_in: string | null;
  looking_for: string | null;
  images_json: string[];
  prompts_json: any;
  // From profiles join
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  university: string | null;
  age?: number | null;
}

export function useDatingCandidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<DatingCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get my profile for university filter
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();

      // Get already liked/passed user IDs
      const [{ data: likes }, { data: passes }] = await Promise.all([
        supabase.from('dating_likes').select('to_user_id').eq('from_user_id', user.id),
        supabase.from('dating_passes').select('to_user_id').eq('from_user_id', user.id),
      ]);

      const excludeIds = new Set<string>([
        user.id,
        ...(likes?.map(l => l.to_user_id) || []),
        ...(passes?.map(p => p.to_user_id) || []),
      ]);

      // Fetch active dating profiles
      let query = supabase
        .from('dating_profiles')
        .select('user_id, bio, gender, interested_in, looking_for, images_json, prompts_json')
        .eq('is_active', true)
        .neq('user_id', user.id)
        .limit(40);

      const { data: datingProfiles, error } = await query;
      if (error) throw error;

      // Filter out already interacted
      const filtered = (datingProfiles || []).filter(dp => !excludeIds.has(dp.user_id));

      // Fetch profile info for remaining candidates
      if (filtered.length === 0) {
        setCandidates([]);
        return;
      }

      const userIds = filtered.map(dp => dp.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, university')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const result: DatingCandidate[] = filtered
        .filter(dp => {
          const p = profileMap.get(dp.user_id);
          // University gate
          return p && myProfile?.university && p.university === myProfile.university;
        })
        .map(dp => {
          const p = profileMap.get(dp.user_id)!;
          return {
            user_id: dp.user_id,
            bio: dp.bio,
            gender: dp.gender,
            interested_in: dp.interested_in,
            looking_for: dp.looking_for,
            images_json: Array.isArray(dp.images_json) ? dp.images_json as string[] : [],
            prompts_json: dp.prompts_json,
            full_name: p.full_name,
            username: p.username,
            avatar_url: p.avatar_url,
            university: p.university,
          };
        })
        .slice(0, 20);

      setCandidates(result);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const likeUser = async (toUserId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('dating_likes')
        .insert({ from_user_id: user.id, to_user_id: toUserId });
      if (error) throw error;

      // Check for mutual like
      const { data: mutual } = await supabase
        .from('dating_likes')
        .select('id')
        .eq('from_user_id', toUserId)
        .eq('to_user_id', user.id)
        .maybeSingle();

      if (mutual) {
        // It's a match! Create match record
        const { error: matchErr } = await supabase
          .from('dating_matches')
          .insert({
            user1_id: user.id < toUserId ? user.id : toUserId,
            user2_id: user.id < toUserId ? toUserId : user.id,
          });
        if (matchErr && !matchErr.message.includes('duplicate')) throw matchErr;
        setMatchedUserId(toUserId);
        return true; // match!
      }

      // Remove from local candidates
      setCandidates(prev => prev.filter(c => c.user_id !== toUserId));
      return false;
    } catch (err) {
      console.error('Error liking user:', err);
      toast.error('Failed to like');
      return false;
    }
  };

  const passUser = async (toUserId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('dating_passes')
        .insert({ from_user_id: user.id, to_user_id: toUserId });
      if (error) throw error;
      setCandidates(prev => prev.filter(c => c.user_id !== toUserId));
    } catch (err) {
      console.error('Error passing user:', err);
    }
  };

  const clearMatch = () => setMatchedUserId(null);

  return { candidates, loading, fetchCandidates, likeUser, passUser, matchedUserId, clearMatch };
}
