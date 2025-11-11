// src/hooks/useAnonymousChat.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MessageReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface AnonymousMessage {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  university: string; // added – needed for the “university” filter
  reactions: MessageReaction[];
}

export function useAnonymousChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [loading, setLoading] = useState(true);

  /* --------------------------------------------------------------
     1. Load the last 50 messages + all their reactions in ONE go
     -------------------------------------------------------------- */
  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      // 1. messages
      const { data: msgs, error: msgErr } = await supabase
        .from("anonymous_messages")
        .select("id, message, created_at, user_id, university")
        .order("created_at", { ascending: true })
        .limit(50);

      if (msgErr) throw msgErr;

      // 2. reactions for those ids
      const ids = msgs?.map((m) => m.id) ?? [];
      const { data: reacts, error: reactErr } = await supabase
        .from("anonymous_message_reactions")
        .select("message_id, emoji, user_id")
        .in("message_id", ids);

      if (reactErr) throw reactErr;

      // 3. group reactions
      const reactMap = (reacts ?? []).reduce(
        (acc, r) => {
          const key = `${r.message_id}¦${r.emoji}`;
          if (!acc[key]) acc[key] = { users: [], count: 0 };
          acc[key].users.push(r.user_id);
          acc[key].count++;
          return acc;
        },
        {} as Record<string, { users: string[]; count: number }>,
      );

      // 4. attach to messages
      const enriched = (msgs ?? []).map((msg) => {
        const msgReacts: MessageReaction[] = [];
        for (const emoji of Object.keys(reactMap)) {
          const parts = emoji.split("¦");
          if (parts[0] !== msg.id) continue;
          const data = reactMap[emoji];
          msgReacts.push({
            emoji: parts[1],
            count: data.count,
            hasReacted: data.users.includes(user?.id ?? ""),
          });
        }
        return { ...msg, reactions: msgReacts };
      });

      setMessages(enriched);
    } catch (e) {
      console.error("useAnonymousChat → fetchAll", e);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /* --------------------------------------------------------------
     2. Realtime subscription (INSERT + reaction changes)
     -------------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;

    fetchAll(); // initial load

    const channel = supabase
      .channel("anon-chat")
      // ---- new messages -------------------------------------------------
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "anonymous_messages" }, (payload) => {
        const newMsg = payload.new as any;
        setMessages((prev) => [...prev, { ...newMsg, reactions: [] } as AnonymousMessage]);
      })
      // ---- reaction INSERT / DELETE ------------------------------------
      .on("postgres_changes", { event: "*", schema: "public", table: "anonymous_message_reactions" }, () => {
        // any reaction change → just refresh the whole list (cheap, <50 rows)
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAll]);

  /* --------------------------------------------------------------
     3. Send a message (university guard stays unchanged)
     -------------------------------------------------------------- */
  const sendMessage = async (text: string) => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from("profiles").select("university").eq("user_id", user.id).single();

      if (!profile?.university) {
        toast.error("Please set your university in your profile first");
        return;
      }

      const { error } = await supabase.from("anonymous_messages").insert({
        user_id: user.id,
        university: profile.university,
        message: text,
      });

      if (error) throw error;
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    }
  };

  /* --------------------------------------------------------------
     4. Toggle reaction (INSERT / DELETE) – UI updates via realtime
     -------------------------------------------------------------- */
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      // check if already reacted
      const { data: existing } = await supabase
        .from("anonymous_message_reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        // remove
        await supabase.from("anonymous_message_reactions").delete().eq("id", existing.id);
      } else {
        // add
        await supabase.from("anonymous_message_reactions").insert({ message_id: messageId, user_id: user.id, emoji });
      }
      // realtime listener will call fetchAll() → UI updates instantly
    } catch (e) {
      console.error(e);
      toast.error("Failed to update reaction");
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    toggleReaction,
    refresh: fetchAll, // optional manual refresh
  };
}
