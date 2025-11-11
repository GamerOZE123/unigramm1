import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  conversation_id: string;
}

export function useMessageSearch() {
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const searchMessages = async (conversationId: string, query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching messages:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
  };

  return {
    searchResults,
    loading,
    searchMessages,
    clearSearch,
  };
}
