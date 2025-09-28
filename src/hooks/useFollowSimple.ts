import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FollowData {
  id: string;
  follower_id: string;
  followed_id: string;
}

export const useFollowSimple = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const followUser = async (targetUserId: string) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: user.id, followed_id: targetUserId }]);
      
      if (error) throw error;
      toast.success('User followed successfully');
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', targetUserId);
      
      if (error) throw error;
      toast.success('User unfollowed successfully');
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkIsFollowing = async (targetUserId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('followed_id', targetUserId)
        .single();
      
      return !error && !!data;
    } catch (error) {
      return false;
    }
  };

  return {
    followUser,
    unfollowUser,
    checkIsFollowing,
    loading
  };
};