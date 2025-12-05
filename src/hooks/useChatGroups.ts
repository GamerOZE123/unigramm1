import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatGroup {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export const useChatGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch groups where user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from('chat_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // Fetch group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('chat_groups')
        .select('*')
        .in('id', groupIds)
        .order('updated_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('chat_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          return {
            ...group,
            member_count: count || 0
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();

      // Subscribe to group changes with live updates
      const groupsChannel = supabase
        .channel('chat-groups-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_groups',
          },
          (payload) => {
            const updated = payload.new as ChatGroup;
            setGroups(prev => {
              const exists = prev.some(g => g.id === updated.id);
              if (!exists) return prev;
              const filtered = prev.filter(g => g.id !== updated.id);
              const existing = prev.find(g => g.id === updated.id);
              return [{ ...updated, member_count: existing?.member_count || 0 }, ...filtered];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_group_members',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // When user is added to a new group, fetch all groups
            fetchGroups();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_group_members',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const deleted = payload.old as { group_id: string };
            setGroups(prev => prev.filter(g => g.id !== deleted.group_id));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(groupsChannel);
      };
    }
  }, [user]);

  return {
    groups,
    loading,
    refreshGroups: fetchGroups,
  };
};
