import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PinnedMessage {
  id: string;
  conversation_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
  message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    sender?: {
      full_name: string;
      avatar_url: string;
      username: string;
    };
  };
}

export const useConversationPinnedMessages = (conversationId: string | null) => {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPinnedMessages = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversation_pinned_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('pinned_at', { ascending: false });

      if (error) throw error;

      // Fetch message details and sender profiles
      if (data && data.length > 0) {
        const messageIds = data.map(d => d.message_id);
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at')
          .in('id', messageIds);

        const senderIds = [...new Set(messages?.map(m => m.sender_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, username')
          .in('user_id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        const messageMap = new Map(messages?.map(m => [m.id, m]));
        
        const enrichedData = data.map(item => {
          const message = messageMap.get(item.message_id);
          return {
            ...item,
            message: message ? {
              ...message,
              sender: message.sender_id ? profileMap.get(message.sender_id) : undefined
            } : undefined
          };
        });

        setPinnedMessages(enrichedData as any);
      } else {
        setPinnedMessages([]);
      }
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const pinMessage = async (messageId: string) => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('conversation_pinned_messages')
        .insert([{
          conversation_id: conversationId,
          message_id: messageId,
          pinned_by: user.id,
        }]);

      if (error) throw error;
      
      toast.success('Message pinned');
      fetchPinnedMessages();
    } catch (error: any) {
      console.error('Error pinning message:', error);
      if (error.code === '23505') {
        toast.error('Message is already pinned');
      } else {
        toast.error(error?.message || 'Failed to pin message');
      }
    }
  };

  const unpinMessage = async (pinnedMessageId: string) => {
    try {
      const { error } = await supabase
        .from('conversation_pinned_messages')
        .delete()
        .eq('id', pinnedMessageId);

      if (error) throw error;
      
      toast.success('Message unpinned');
      fetchPinnedMessages();
    } catch (error: any) {
      console.error('Error unpinning message:', error);
      toast.error(error?.message || 'Failed to unpin message');
    }
  };

  const isPinned = (messageId: string) => {
    return pinnedMessages.some(p => p.message_id === messageId);
  };

  const getPinnedMessageId = (messageId: string) => {
    return pinnedMessages.find(p => p.message_id === messageId)?.id;
  };

  useEffect(() => {
    if (conversationId) {
      fetchPinnedMessages();

      // Subscribe to changes
      const subscription = supabase
        .channel(`conversation_pinned_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_pinned_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          () => {
            fetchPinnedMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [conversationId]);

  return {
    pinnedMessages,
    loading,
    pinMessage,
    unpinMessage,
    isPinned,
    getPinnedMessageId,
    refreshPinnedMessages: fetchPinnedMessages,
  };
};
