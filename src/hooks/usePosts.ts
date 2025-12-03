import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  hashtags: string[] | null;
  image_url: string | null;
  image_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  post_type: string;

  // ⭐ Poll fields
  poll_question?: string | null;
  poll_options?: any | null;
  poll_ends_at?: string | null;

  // ⭐ Survey fields
  survey_questions?: any | null;

  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      // Fetch posts with poll + survey fields
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
          id,
          user_id,
          content,
          hashtags,
          image_url,
          image_urls,
          likes_count,
          comments_count,
          views_count,
          created_at,
          updated_at,
          post_type,
          poll_question,
          poll_options,
          poll_ends_at,
          survey_questions
        `,
        )
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData.map((post) => post.user_id))];

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Map user_id → profile
      const profilesMap = new Map();
      profilesData?.forEach((profile) => {
        profilesMap.set(profile.user_id, profile);
      });

      // Transform posts by attaching profiles
      const transformedPosts: Post[] = postsData.map((post) => {
        const profile = profilesMap.get(post.user_id);

        return {
          ...post,
          profiles: {
            full_name: profile?.full_name || "Anonymous User",
            username: profile?.username || "user",
            avatar_url: profile?.avatar_url || "",
          },
        };
      });

      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const getPostById = async (postId: string) => {
    try {
      // Fetch specific post with poll + survey fields
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select(
          `
          id,
          user_id,
          content,
          hashtags,
          image_url,
          image_urls,
          likes_count,
          comments_count,
          views_count,
          created_at,
          updated_at,
          post_type,
          poll_question,
          poll_options,
          poll_ends_at,
          survey_questions
        `,
        )
        .eq("id", postId)
        .single();

      if (postError) throw postError;
      if (!postData) return null;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .eq("user_id", postData.user_id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      return {
        ...postData,
        profiles: {
          full_name: profileData?.full_name || "Anonymous User",
          username: profileData?.username || "user",
          avatar_url: profileData?.avatar_url || "",
        },
      };
    } catch (error) {
      console.error("Error fetching post:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    refetch: fetchPosts,
    getPostById,
  };
};
