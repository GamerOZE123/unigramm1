import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface AnonymousMessage {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  reactions: MessageReaction[];
}

export function useAnonymousChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('anonymous-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anonymous_messages',
        },
        (payload) => {
          const newMessage = {
            ...(payload.new as any),
            reactions: [],
          };
          setMessages((current) => [...current, newMessage]);
        }
      )
      .subscribe();

    // Subscribe to reaction changes
    const reactionsChannel = supabase
      .channel('anonymous-reactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'anonymous_message_reactions',
        },
        () => {
          // Refresh messages when reactions change
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('anonymous_messages')
        .select('id, message, created_at, user_id')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Fetch reactions for all messages
      const messageIds = messagesData?.map(m => m.id) || [];
      const { data: reactionsData } = await supabase
        .from('anonymous_message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', messageIds);

      // Group reactions by message
      const messageReactions = (reactionsData || []).reduce((acc, reaction) => {
        if (!acc[reaction.message_id]) {
          acc[reaction.message_id] = {};
        }
        if (!acc[reaction.message_id][reaction.emoji]) {
          acc[reaction.message_id][reaction.emoji] = { users: [], count: 0 };
        }
        acc[reaction.message_id][reaction.emoji].users.push(reaction.user_id);
        acc[reaction.message_id][reaction.emoji].count++;
        return acc;
      }, {} as Record<string, Record<string, { users: string[], count: number }>>);

      // Attach reactions to messages
      const messagesWithReactions = (messagesData || []).map(msg => ({
        ...msg,
        reactions: Object.entries(messageReactions[msg.id] || {}).map(([emoji, data]) => ({
          emoji,
          count: data.count,
          hasReacted: data.users.includes(user?.id || ''),
        })),
      }));

      setMessages(messagesWithReactions);
    } catch (error) {
      console.error('Error fetching anonymous messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();

      if (!profile?.university) {
        toast.error('Please set your university in your profile first');
        return;
      }

      const { error } = await supabase
        .from('anonymous_messages')
        .insert({
          user_id: user.id,
          university: profile.university,
          message: message,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('anonymous_message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('anonymous_message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('anonymous_message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
      }

      // Refresh messages to update reactions
      fetchMessages();
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    toggleReaction,
  };
}
