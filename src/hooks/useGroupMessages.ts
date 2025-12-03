import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

export const useGroupMessages = (groupId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    if (!groupId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      const messagesWithSenders = (data || []).map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id)
      }));

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!groupId || !user || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending group message:', error);
      return false;
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel(`group-messages-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`
          },
          async (payload) => {
            const newMessage = payload.new as GroupMessage;
            
            // Fetch sender profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, full_name, username, avatar_url')
              .eq('user_id', newMessage.sender_id)
              .single();

            setMessages(prev => [...prev, { ...newMessage, sender: profile || undefined }]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [groupId, user]);

  return {
    messages,
    loading,
    sendMessage,
    refreshMessages: fetchMessages
  };
};
