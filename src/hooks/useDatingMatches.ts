import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DatingMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string | null;
  other_user: {
    user_id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  last_message?: string | null;
  unread_count?: number;
}

export interface DatingMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

export function useDatingMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<DatingMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('dating_matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const otherUserIds = (data || []).map(m =>
        m.user1_id === user.id ? m.user2_id : m.user1_id
      );

      if (otherUserIds.length === 0) {
        setMatches([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', otherUserIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      // Get last messages for each match
      const matchIds = (data || []).map(m => m.id);
      const { data: messages } = await supabase
        .from('dating_messages')
        .select('match_id, content, is_read, sender_id, created_at')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      const lastMsgMap = new Map<string, { content: string | null; unread: number }>();
      for (const msg of messages || []) {
        if (!lastMsgMap.has(msg.match_id)) {
          lastMsgMap.set(msg.match_id, { content: msg.content, unread: 0 });
        }
        if (msg.sender_id !== user.id && !msg.is_read) {
          const entry = lastMsgMap.get(msg.match_id)!;
          entry.unread++;
        }
      }

      const result: DatingMatch[] = (data || []).map(m => {
        const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
        const p = profileMap.get(otherId);
        const msgInfo = lastMsgMap.get(m.id);
        return {
          ...m,
          other_user: {
            user_id: otherId,
            full_name: p?.full_name || null,
            username: p?.username || null,
            avatar_url: p?.avatar_url || null,
          },
          last_message: msgInfo?.content || null,
          unread_count: msgInfo?.unread || 0,
        };
      });

      setMatches(result);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Realtime subscription for new matches
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dating-matches-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'dating_matches',
      }, (payload) => {
        const row = payload.new as any;
        if (row.user1_id === user.id || row.user2_id === user.id) {
          fetchMatches();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMatches]);

  return { matches, loading, refetch: fetchMatches };
}

export function useDatingMessages(matchId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DatingMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!matchId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dating_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread as read
      await supabase
        .from('dating_messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error fetching dating messages:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!matchId) return;
    const channel = supabase
      .channel(`dating-messages-${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dating_messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as DatingMessage;
          setMessages(prev => {
            // Deduplicate in case of race condition
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Auto-mark as read if not sender
          if (user && newMsg.sender_id !== user.id) {
            supabase
              .from('dating_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as DatingMessage;
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, user]);

  const sendMessage = async (content: string) => {
    if (!matchId || !user || !content.trim()) return;
    try {
      const { error } = await supabase
        .from('dating_messages')
        .insert({ match_id: matchId, sender_id: user.id, content: content.trim() });
      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return { messages, loading, sendMessage };
}
