
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrendingHashtag {
  hashtag: string;
  post_count: number;
  unique_users: number;
  last_used: string;
}

export const useTrendingHashtags = () => {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendingHashtags = async () => {
    try {
      // Try to fetch from the trending_hashtags view first
      const { data, error } = await supabase
        .from('trending_hashtags')
        .select('*')
        .limit(5);
      
      if (error) {
        console.error('Error fetching trending hashtags:', error);
        // Fallback: Calculate trending hashtags from posts directly
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('hashtags, user_id, created_at')
          .not('hashtags', 'is', null)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
        if (postsError) throw postsError;
        
        // Process hashtags manually
        const hashtagMap = new Map<string, {
          post_count: number;
          unique_users: Set<string>;
          last_used: string;
        }>();
        
        postsData?.forEach(post => {
          if (post.hashtags && Array.isArray(post.hashtags)) {
            post.hashtags.forEach((hashtag: string) => {
              const existing = hashtagMap.get(hashtag) || {
                post_count: 0,
                unique_users: new Set(),
                last_used: post.created_at
              };
              
              existing.post_count += 1;
              existing.unique_users.add(post.user_id);
              
              if (new Date(post.created_at) > new Date(existing.last_used)) {
                existing.last_used = post.created_at;
              }
              
              hashtagMap.set(hashtag, existing);
            });
          }
        });
        
        // Convert to array and sort
        const trendingHashtags: TrendingHashtag[] = Array.from(hashtagMap.entries())
          .map(([hashtag, data]) => ({
            hashtag,
            post_count: data.post_count,
            unique_users: data.unique_users.size,
            last_used: data.last_used
          }))
          .sort((a, b) => b.post_count - a.post_count)
          .slice(0, 5);
        
        setHashtags(trendingHashtags);
      } else {
        setHashtags(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTrendingHashtags:', error);
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  return { hashtags, loading, refetch: fetchTrendingHashtags };
};
