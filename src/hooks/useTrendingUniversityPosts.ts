import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrendingHashtag {
  hashtag: string;
  post_count: number;
}

export function useTrendingUniversityPosts(limit: number = 5) {
  const { user } = useAuth();
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTrendingHashtags();
  }, [user, limit]);

  const fetchTrendingHashtags = async () => {
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
        setHashtags([]);
        return;
      }

      // Fetch posts from the same university from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, hashtags, user_id, created_at')
        .not('hashtags', 'is', null)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      // Fetch profiles to filter by university
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, university')
        .in('user_id', userIds)
        .eq('university', userProfile.university);

      const universityUserIds = new Set(profilesData?.map(p => p.user_id) || []);

      // Filter posts by university users and count hashtags
      const hashtagCounts: Record<string, number> = {};
      
      (postsData || [])
        .filter(post => universityUserIds.has(post.user_id))
        .forEach(post => {
          if (post.hashtags && Array.isArray(post.hashtags)) {
            post.hashtags.forEach(tag => {
              if (tag) {
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
              }
            });
          }
        });

      // Convert to array and sort by count
      const sortedHashtags = Object.entries(hashtagCounts)
        .map(([hashtag, post_count]) => ({ hashtag, post_count }))
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, limit);

      setHashtags(sortedHashtags);
    } catch (error) {
      console.error('Error fetching trending university hashtags:', error);
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  };

  return { hashtags, loading, refetch: fetchTrendingHashtags };
}
