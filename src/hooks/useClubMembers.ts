import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClubMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
    university: string;
  } | null;
}

export const useClubMembers = (clubId: string | null) => {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (clubId) {
      fetchMembers();
    }
  }, [clubId]);

  const fetchMembers = async () => {
    if (!clubId) return;
    
    setLoading(true);
    try {
      // First get the memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('club_memberships')
        .select('id, user_id, role, joined_at, club_id')
        .eq('club_id', clubId)
        .order('joined_at', { ascending: false })
        .limit(100);

      if (membershipsError) throw membershipsError;

      if (memberships && memberships.length > 0) {
        // Then get the profiles for those users
        const userIds = memberships.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, university')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        const data = memberships.map(m => ({
          ...m,
          profiles: profilesMap.get(m.user_id) || null
        }));

        setMembers(data);
      } else {
        setMembers([]);
      }

    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (membershipId: string) => {
    try {
      const { error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Member removed successfully"
      });
      
      await fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const updateMemberRole = async (membershipId: string, newRole: string) => {
    try {
      // Normalize role - capitalize first letter
      const normalizedRole = newRole.trim().charAt(0).toUpperCase() + newRole.trim().slice(1).toLowerCase();
      
      const { error } = await supabase
        .from('club_memberships')
        .update({ role: normalizedRole })
        .eq('id', membershipId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Member role updated successfully"
      });
      
      await fetchMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive"
      });
    }
  };

  return {
    members,
    loading,
    removeMember,
    updateMemberRole,
    refetch: fetchMembers
  };
};
