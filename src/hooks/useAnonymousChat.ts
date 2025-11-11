import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AnonymousMessage {
  id: string;
  message: string;
  created_at: string;
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
          setMessages((current) => [payload.new as AnonymousMessage, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('anonymous_messages')
        .select('id, message, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
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

  return {
    messages,
    loading,
    sendMessage,
  };
}
