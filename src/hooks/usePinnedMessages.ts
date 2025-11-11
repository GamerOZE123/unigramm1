import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PinnedMessage {
  id: string;
  group_id: string;
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
    };
  };
}

export const usePinnedMessages = (groupId?: string) => {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPinnedMessages = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .select(`
          *,
          message:group_messages!inner(
            id,
            content,
            sender_id,
            created_at
          )
        `)
        .eq('group_id', groupId)
        .order('pinned_at', { ascending: false });

      if (error) throw error;

      // Fetch sender profiles separately
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(d => d.message?.sender_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        
        const enrichedData = data.map(item => ({
          ...item,
          message: item.message ? {
            ...item.message,
            sender: profileMap.get(item.message.sender_id)
          } : undefined
        }));

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
    if (!groupId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('pinned_messages')
        .insert([{
          group_id: groupId,
          message_id: messageId,
          pinned_by: user.id,
        }]);

      if (error) throw error;
      
      toast.success('Message pinned');
      fetchPinnedMessages();
    } catch (error: any) {
      console.error('Error pinning message:', error);
      toast.error(error?.message || 'Failed to pin message');
    }
  };

  const unpinMessage = async (pinnedMessageId: string) => {
    try {
      const { error } = await supabase
        .from('pinned_messages')
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

  useEffect(() => {
    if (groupId) {
      fetchPinnedMessages();

      // Subscribe to changes
      const subscription = supabase
        .channel(`pinned_messages_${groupId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pinned_messages',
            filter: `group_id=eq.${groupId}`,
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
  }, [groupId]);

  return {
    pinnedMessages,
    loading,
    pinMessage,
    unpinMessage,
    refreshPinnedMessages: fetchPinnedMessages,
  };
};
