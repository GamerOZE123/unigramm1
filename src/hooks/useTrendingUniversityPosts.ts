import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrendingPost {
  id: string;
  content: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
  engagement_score: number;
}

export function useTrendingUniversityPosts(limit: number = 5) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTrendingPosts();
  }, [user, limit]);

  const fetchTrendingPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First get the current user's university
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();

      if (!userProfile?.university) {
        setPosts([]);
        return;
      }

      // Fetch posts from the same university from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          user_id,
          likes_count,
          comments_count,
          views_count,
          created_at
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately and join in memory
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, university')
        .in('user_id', userIds)
        .eq('university', userProfile.university);

      // Create a map for quick profile lookup
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      // Filter posts by users from the same university and join with profiles
      const postsWithProfiles = (postsData || [])
        .filter(post => profilesMap.has(post.user_id))
        .map(post => ({
          ...post,
          profiles: profilesMap.get(post.user_id)!
        }));

      // Calculate engagement score and sort
      const rankedPosts = postsWithProfiles.map(post => ({
        ...post,
        engagement_score: (post.likes_count * 3) + (post.comments_count * 5) + (post.views_count * 0.1)
      }))
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, limit);

      setPosts(rankedPosts);
    } catch (error) {
      console.error('Error fetching trending university posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return { posts, loading, refetch: fetchTrendingPosts };
}
