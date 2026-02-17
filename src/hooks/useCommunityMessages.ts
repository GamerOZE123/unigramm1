import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommunityMessage {
  id: string;
  community_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

export const useCommunityMessages = (communityId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!communityId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      setMessages(
        (data || []).map(msg => ({
          ...msg,
          sender: profileMap.get(msg.sender_id),
        }))
      );
    } catch (error) {
      console.error('Error fetching community messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!communityId || !user || !content.trim()) return false;
    try {
      const { error } = await supabase.from('community_messages').insert({
        community_id: communityId,
        sender_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  useEffect(() => {
    if (communityId) {
      fetchMessages();

      const channel = supabase
        .channel(`community-messages-${communityId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'community_messages',
            filter: `community_id=eq.${communityId}`,
          },
          async (payload) => {
            const newMsg = payload.new as CommunityMessage;
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, full_name, username, avatar_url')
              .eq('user_id', newMsg.sender_id)
              .single();

            setMessages(prev => [...prev, { ...newMsg, sender: profile || undefined }]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [communityId, user]);

  return { messages, loading, sendMessage, refreshMessages: fetchMessages };
};
