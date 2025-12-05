import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RecentChat {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_university: string;
  last_interacted_at: string;
}

export const useRecentChats = () => {
  const { user } = useAuth();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentChats = async () => {
    if (!user) return;

    try {
      console.log('Fetching recent chats for user:', user.id);
      const { data, error } = await supabase.rpc('get_recent_chats', {
        target_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching recent chats:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Fetched recent chats:', data);
      setRecentChats(data || []);
    } catch (error) {
      console.error('Error fetching recent chats:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

const addRecentChat = async (otherUserId: string) => {
  if (!user) {
    console.error('No authenticated user found');
    toast.error('Please log in to add a chat');
    return;
  }

  try {
    console.log('Adding recent chat:', { userId: user.id, otherUserId });

    // Fetch user details from profiles table
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('full_name, username, university, avatar_url')
      .eq('user_id', otherUserId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user details:', userError?.message || 'No user data');
      toast.error('Failed to fetch user details');
      throw new Error(userError?.message || 'User not found');
    }

    const otherUserName = userData.full_name || userData.username || 'Unknown';
    const otherUserUniversity = userData.university || '';
    const otherUserAvatar = userData.avatar_url || '';

    console.log('User details fetched:', { otherUserName, otherUserUniversity, otherUserAvatar });

    // Call upsert_recent_chat RPC with type assertion to bypass strict typing
    const { error: upsertError } = await supabase.rpc('upsert_recent_chat' as any, {
      current_user_id: user.id,
      target_user_id: otherUserId,
      other_user_name: otherUserName,
      other_user_university: otherUserUniversity,
      other_user_avatar: otherUserAvatar,
    } as any);

    if (upsertError) {
      console.error('Error upserting recent chat:', JSON.stringify(upsertError, null, 2));
      toast.error('Failed to add user to recent chats');
      throw upsertError;
    }

    console.log('Recent chat added successfully for user:', otherUserId);
    await fetchRecentChats(); // Refresh the list
  } catch (error) {
    console.error('Error in addRecentChat:', JSON.stringify(error, null, 2));
    toast.error('Failed to add recent chat');
  }
};
  useEffect(() => {
    if (user) {
      fetchRecentChats();

      // Real-time: Live update on recent_chats changes
      const recentChatsChannel = supabase
        .channel('recent-chats-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'recent_chats',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updated = payload.new as RecentChat & { user_id: string };
            setRecentChats(prev => {
              const filtered = prev.filter(c => c.other_user_id !== updated.other_user_id);
              const updatedChat: RecentChat = {
                other_user_id: updated.other_user_id,
                other_user_name: updated.other_user_name,
                other_user_avatar: updated.other_user_avatar,
                other_user_university: updated.other_user_university,
                last_interacted_at: updated.last_interacted_at,
              };
              return [updatedChat, ...filtered];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'recent_chats',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const inserted = payload.new as RecentChat & { user_id: string };
            setRecentChats(prev => {
              const exists = prev.some(c => c.other_user_id === inserted.other_user_id);
              if (exists) return prev;
              const newChat: RecentChat = {
                other_user_id: inserted.other_user_id,
                other_user_name: inserted.other_user_name,
                other_user_avatar: inserted.other_user_avatar,
                other_user_university: inserted.other_user_university,
                last_interacted_at: inserted.last_interacted_at,
              };
              return [newChat, ...prev];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(recentChatsChannel);
      };
    }
  }, [user]);

  return {
    recentChats,
    loading,
    addRecentChat,
    refreshRecentChats: fetchRecentChats,
  };
};
