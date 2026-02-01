import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_university: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  media_url?: string[] | null;
  media_type?: string | null;
}

export const useChat = () => {
  const { user } = useAuth();
  // NOTE: Conversations list is now handled by useRecentChats hook (get_recent_chats RPC)
  // This hook focuses on message operations only
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  // Loading state should reflect initial message fetch for the active conversation.
  // (Previously it was never set to false, causing the UI to stay in a perpetual spinner.)
  const [loading, setLoading] = useState(false);
  const [isChatCleared, setIsChatCleared] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [clearedAt, setClearedAt] = useState<string | null>(null);

  const fetchMessages = async (conversationId: string, offset = 0, limit = 15) => {
    if (!user) return;
    // Only show the global loading spinner for the initial load.
    if (offset === 0) setLoading(true);
    try {
      setActiveConversationId(conversationId);
      const { data: clearedData, error: clearedError } = await supabase
        .from('cleared_chats')
        .select('cleared_at')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (clearedError) throw clearedError;
      if (clearedData?.cleared_at) {
        setIsChatCleared(true);
        setClearedAt(clearedData.cleared_at);
      } else {
        setIsChatCleared(false);
        setClearedAt(null);
      }
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId);
      if (clearedData?.cleared_at) {
        query = query.gt('created_at', clearedData.cleared_at);
      }
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      if (offset === 0) {
        setCurrentMessages(data?.reverse() || []);
      } else {
        setCurrentMessages((prev) => [...(data?.reverse() || []), ...prev]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (offset === 0) setCurrentMessages([]);
    } finally {
      if (offset === 0) setLoading(false);
    }
  };

  const loadOlderMessages = async (conversationId: string) => {
    const offset = currentMessages.length;
    await fetchMessages(conversationId, offset);
  };

  const sendMessage = async (conversationId: string, content: string, mediaUrl?: string | null) => {
    // Allow sending if there's either content or media
    if (!user || (!content.trim() && !mediaUrl)) {
      return { success: false, error: 'No user or empty content' };
    }
    try {
      const messageData: any = {
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim() || (mediaUrl ? '📷' : ''),
      };
      
      if (mediaUrl) {
        messageData.media_url = [mediaUrl]; // Store as array
        // Determine media type from URL
        if (mediaUrl.match(/\.(mp4|webm|ogg)$/i)) {
          messageData.media_type = 'video';
        } else {
          messageData.media_type = 'image';
        }
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: (error as Error).message };
    }
  };

  const createConversation = async (otherUserId: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user1_id: user.id,
        p_user2_id: otherUserId,
      });
      if (error) throw error;
      // NOTE: recent_chats is updated automatically via update_recent_chats_on_message trigger
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const clearChat = async (conversationId: string) => {
    if (!user) return { success: false, error: 'No user' };
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('cleared_chats').upsert(
        {
          user_id: user.id,
          conversation_id: conversationId,
          cleared_at: now,
        },
        { onConflict: 'user_id,conversation_id' }
      );
      if (error) throw error;
      setIsChatCleared(true);
      setClearedAt(now);
      setCurrentMessages([]);
      return { success: true };
    } catch (error) {
      console.error('Error clearing chat:', error);
      return { success: false, error: (error as Error).message };
    }
  };


const deleteChat = async (conversationId: string, otherUserId: string) => {
  if (!user) return { success: false, error: 'No user' };
  try {
    const now = new Date().toISOString();
    console.log('Deleting chat (Instagram-style):', { userId: user.id, conversationId, otherUserId });

    // Mark in deleted_chats (per-user)
    const { error: deletedError } = await supabase
      .from('deleted_chats')
      .upsert(
        {
          user_id: user.id,
          conversation_id: conversationId,
          deleted_at: now,
        },
        { onConflict: 'user_id,conversation_id' }
      );
    if (deletedError) {
      console.error('Deleted chats error:', deletedError);
      throw deletedError;
    }

    // Soft-delete in recent_chats (hides from your list only)
    const { data: recentChat } = await supabase
      .from('recent_chats')
      .select('id')
      .eq('user_id', user.id)
      .eq('other_user_id', otherUserId)
      .single();

    if (recentChat) {
      const { error: recentError } = await supabase
        .from('recent_chats')
        .delete()
        .eq('id', recentChat.id);
      if (recentError) {
        console.error('Recent chats error:', recentError);
        throw recentError;
      }
    } else {
      console.warn('No recent chat found; skipping update');
    }

    // Local UI update - clear messages from view
    if (activeConversationId === conversationId) {
      setCurrentMessages([]);  // Clear messages from view (Instagram: empty on re-open)
      setActiveConversationId(null);
    }

    // NOTE: recent_chats list refresh is handled by the caller (Chat.tsx calls refreshRecentChats)

    // Trigger refresh for recent list
    // Note: Call refreshRecentChats() in Chat.tsx after this

    return { success: true };
  } catch (error) {
    console.error('Error deleting chat:', JSON.stringify(error, null, 2));
    return { success: false, error: (error as Error).message };
  }
};

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;
    const msgChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.conversation_id === activeConversationId) {
            if (payload.eventType === 'INSERT') {
              if (!clearedAt || msg.created_at > clearedAt) {
                setCurrentMessages((prev) => [...prev, msg]);
              }
            } else if (payload.eventType === 'UPDATE') {
              setCurrentMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? msg : m))
              );
            } else if (payload.eventType === 'DELETE') {
              setCurrentMessages((prev) =>
                prev.filter((m) => m.id !== payload.old.id)
              );
            }
          }
          // NOTE: recent_chats list is updated automatically via triggers
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [user, activeConversationId, clearedAt]);

  return {
    currentMessages,
    loading,
    isChatCleared,
    fetchMessages,
    loadOlderMessages,
    sendMessage,
    createConversation,
    clearChat,
    deleteChat,
  };
};
