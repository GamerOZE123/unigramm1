import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface Confession {
  id: string;
  content: string;
  university: string;
  created_at: string;
  user_id: string;
  reactions: Reaction[];
  comment_count: number;
}

export interface ConfessionComment {
  id: string;
  confession_id: string;
  content: string;
  created_at: string;
}

export function useConfessions() {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfessions = useCallback(async () => {
    if (!user) return;
    try {
      const { data: rows, error } = await supabase
        .from("confessions")
        .select("id, content, university, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const ids = rows?.map((r) => r.id) ?? [];

      const [{ data: reacts }, { data: commentCounts }] = await Promise.all([
        supabase
          .from("confession_reactions")
          .select("confession_id, emoji, user_id")
          .in("confession_id", ids),
        supabase
          .from("confession_comments")
          .select("confession_id")
          .in("confession_id", ids),
      ]);

      // Group reactions
      const reactMap: Record<string, { users: string[]; count: number }> = {};
      (reacts ?? []).forEach((r) => {
        const key = `${r.confession_id}¦${r.emoji}`;
        if (!reactMap[key]) reactMap[key] = { users: [], count: 0 };
        reactMap[key].users.push(r.user_id);
        reactMap[key].count++;
      });

      // Count comments per confession
      const commentMap: Record<string, number> = {};
      (commentCounts ?? []).forEach((c) => {
        commentMap[c.confession_id] = (commentMap[c.confession_id] || 0) + 1;
      });

      const enriched: Confession[] = (rows ?? []).map((row) => {
        const msgReacts: Reaction[] = [];
        for (const key of Object.keys(reactMap)) {
          const [cId, emoji] = key.split("¦");
          if (cId !== row.id) continue;
          const data = reactMap[key];
          msgReacts.push({
            emoji,
            count: data.count,
            hasReacted: data.users.includes(user.id),
          });
        }
        return {
          ...row,
          reactions: msgReacts,
          comment_count: commentMap[row.id] || 0,
        };
      });

      setConfessions(enriched);
    } catch (e) {
      console.error("useConfessions → fetch", e);
      toast.error("Failed to load confessions");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchConfessions();

    const channel = supabase
      .channel("confessions-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confessions" }, () => {
        fetchConfessions();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "confession_reactions" }, () => {
        fetchConfessions();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "confession_comments" }, () => {
        fetchConfessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConfessions]);

  const createConfession = async (content: string) => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("university")
        .eq("user_id", user.id)
        .single();

      if (!profile?.university) {
        toast.error("Please set your university in your profile first");
        return;
      }

      const { error } = await supabase.from("confessions").insert({
        user_id: user.id,
        university: profile.university,
        content,
      });

      if (error) throw error;
      toast.success("Confession posted anonymously");
    } catch (e) {
      console.error(e);
      toast.error("Failed to post confession");
    }
  };

  const toggleReaction = async (confessionId: string, emoji: string) => {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("confession_reactions")
        .select("id")
        .eq("confession_id", confessionId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("confession_reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("confession_reactions").insert({
          confession_id: confessionId,
          user_id: user.id,
          emoji,
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update reaction");
    }
  };

  const fetchComments = async (confessionId: string): Promise<ConfessionComment[]> => {
    const { data, error } = await supabase
      .from("confession_comments")
      .select("id, confession_id, content, created_at")
      .eq("confession_id", confessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }
    return data ?? [];
  };

  const addComment = async (confessionId: string, content: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("confession_comments").insert({
        confession_id: confessionId,
        user_id: user.id,
        content,
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
      toast.error("Failed to add comment");
    }
  };

  return {
    confessions,
    loading,
    createConfession,
    toggleReaction,
    fetchComments,
    addComment,
  };
}
