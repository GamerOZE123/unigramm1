import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactions {
  [messageId: string]: Reaction[];
}

export function useMessageReactions(conversationId: string | null) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<MessageReactions>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    fetchReactions();

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`message-reactions-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchReactions = async () => {
    if (!conversationId) return;
    setLoading(true);

    try {
      // Get all messages in the conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId);

      if (!messages || messages.length === 0) {
        setReactions({});
        return;
      }

      const messageIds = messages.map((m) => m.id);

      // Get all reactions for these messages
      const { data: reactionData } = await supabase
        .from('message_reactions')
        .select('message_id, reaction_type, user_id')
        .in('message_id', messageIds);

      if (!reactionData) return;

      // Group reactions by message and emoji
      const grouped: MessageReactions = {};
      
      reactionData.forEach((r) => {
        if (!grouped[r.message_id]) {
          grouped[r.message_id] = [];
        }

        const existingReaction = grouped[r.message_id].find(
          (reaction) => reaction.emoji === r.reaction_type
        );

        if (existingReaction) {
          existingReaction.count++;
          if (r.user_id === user?.id) {
            existingReaction.hasReacted = true;
          }
        } else {
          grouped[r.message_id].push({
            emoji: r.reaction_type,
            count: 1,
            hasReacted: r.user_id === user?.id,
          });
        }
      });

      setReactions(grouped);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction_type', emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_type: emoji,
          });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return {
    reactions,
    loading,
    toggleReaction,
  };
}
