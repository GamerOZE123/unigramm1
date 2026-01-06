import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      // Get all conversations for the user
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, user1_id, user2_id, unread_count_user1, unread_count_user2')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (convError) throw convError;

      // Get deleted chats to exclude
      const { data: deletedChats } = await supabase
        .from('deleted_chats')
        .select('conversation_id')
        .eq('user_id', user.id);

      const deletedIds = new Set(deletedChats?.map(d => d.conversation_id) || []);

      // Calculate total unread
      let total = 0;
      conversations?.forEach(conv => {
        if (deletedIds.has(conv.id)) return;
        
        if (conv.user1_id === user.id) {
          total += conv.unread_count_user1 || 0;
        } else if (conv.user2_id === user.id) {
          total += conv.unread_count_user2 || 0;
        }
      });

      // Also get unread from group chats
      const { data: groupMembers } = await supabase
        .from('chat_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (groupMembers && groupMembers.length > 0) {
        const groupIds = groupMembers.map(g => g.group_id);
        
        // Get latest message per group and check if user has read it
        for (const groupId of groupIds) {
          const { data: latestMessage } = await supabase
            .from('group_messages')
            .select('id, created_at, sender_id')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (latestMessage && latestMessage.sender_id !== user.id) {
            // Check if user has seen this message (simplified: assume unread if not sender)
            // This is a simplified approach - you might want a more sophisticated read tracking
            const { data: readStatus } = await supabase
              .from('message_status')
              .select('id')
              .eq('message_id', latestMessage.id)
              .eq('user_id', user.id)
              .eq('status', 'read')
              .single();

            if (!readStatus) {
              total += 1;
            }
          }
        }
      }

      setUnreadCount(total);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    if (!user) return;

    // Subscribe to message changes
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_messages' },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
};
