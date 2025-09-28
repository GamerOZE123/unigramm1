import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  conversation_id: string;
  sender_id: string;
  created_at: string;
}

interface Conversation {
  id: string;
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_university: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const startConversation = async (targetUserId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: targetUserId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_conversations', {
        user_uuid: user.id
      });

      if (error) throw error;

      // Map to expected interface format
      const mappedConversations: Conversation[] = (data || []).map((conv: any) => ({
        id: conv.id,
        conversation_id: conv.id,
        other_user_id: conv.other_user_id,
        other_user_name: conv.other_user_name,
        other_user_avatar: conv.other_user_avatar,
        other_user_university: '', // Not available in current schema
        last_message: '', // Not available in current schema
        last_message_time: conv.last_message_at,
        unread_count: 0 // Not available in current schema
      }));

      setConversations(mappedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    }
  };

  const clearChatHistory = async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cleared_chats')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          cleared_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessages([]);
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast.error('Failed to clear chat history');
    }
  };

  const deleteChat = async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('deleted_chats')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          deleted_at: new Date().toISOString()
        });

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  return {
    conversations,
    messages,
    loading,
    startConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    clearChatHistory,
    deleteChat
  };
};