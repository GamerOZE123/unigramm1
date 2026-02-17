import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  university: string;
  created_by: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export const useCommunities = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [myMemberships, setMyMemberships] = useState<Set<string>>(new Set());

  const fetchCommunities = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get user's university
      const { data: profile } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();

      if (!profile?.university) {
        setLoading(false);
        return;
      }

      // Fetch all public communities for this university
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('university', profile.university)
        .eq('is_public', true)
        .order('member_count', { ascending: false });

      if (error) throw error;
      setCommunities((data as Community[]) || []);

      // Fetch user's memberships
      const { data: memberships, error: memErr } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);

      if (memErr) throw memErr;
      const memberSet = new Set((memberships || []).map(m => m.community_id));
      setMyMemberships(memberSet);

      // Filter my communities
      setMyCommunities(((data as Community[]) || []).filter(c => memberSet.has(c.id)));
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCommunity = async (name: string, description: string) => {
    if (!user) return null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();

      if (!profile?.university) {
        toast.error('University not set on your profile');
        return null;
      }

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          university: profile.university,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as admin
      await supabase.from('community_members').insert({
        community_id: data.id,
        user_id: user.id,
        role: 'admin',
      });

      toast.success('Community created!');
      await fetchCommunities();
      return data as Community;
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast.error('Failed to create community');
      return null;
    }
  };

  const joinCommunity = async (communityId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('community_members').insert({
        community_id: communityId,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success('Joined community!');
      await fetchCommunities();
      return true;
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join');
      return false;
    }
  };

  const leaveCommunity = async (communityId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Left community');
      await fetchCommunities();
      return true;
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error('Failed to leave');
      return false;
    }
  };

  useEffect(() => {
    if (user) fetchCommunities();
  }, [user]);

  return {
    communities,
    myCommunities,
    myMemberships,
    loading,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    refreshCommunities: fetchCommunities,
  };
};
