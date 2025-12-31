import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { memoryCache } from '@/lib/cache';

interface TrendingHashtag {
  hashtag: string;
  post_count: number;
}

// Cache TTL: 30 minutes
const CACHE_TTL_MS = 30 * 60 * 1000;

export function useTrendingUniversityPosts(limit: number = 5) {
  const { user } = useAuth();
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchTrendingHashtags = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First get the current user's university
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();

      if (!userProfile?.university) {
        setHashtags([]);
        setLoading(false);
        return;
      }

      const cacheKey = `trending_university_hashtags_${userProfile.university}`;
      
      // Check cache first
      const cached = memoryCache.get<TrendingHashtag[]>(cacheKey);
      if (cached) {
        setHashtags(cached);
        setLoading(false);
        return;
      }

      // Fetch posts from the same university from the last 7 days (not 30)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // First get user IDs from this university
      const { data: universityProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('university', userProfile.university)
        .limit(500);

      if (!universityProfiles || universityProfiles.length === 0) {
        setHashtags([]);
        setLoading(false);
        return;
      }

      const universityUserIds = universityProfiles.map(p => p.user_id);

      // Fetch posts from those users with hashtags
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('hashtags')
        .in('user_id', universityUserIds)
        .not('hashtags', 'is', null)
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(300);

      if (error) throw error;

      // Count hashtags
      const hashtagCounts: Record<string, number> = {};
      
      (postsData || []).forEach(post => {
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

      // Cache for 30 minutes
      memoryCache.set(cacheKey, sortedHashtags, CACHE_TTL_MS);
      
      setHashtags(sortedHashtags);
    } catch (error) {
      console.error('Error fetching trending university hashtags:', error);
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once when user is available
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchTrendingHashtags();
    }
  }, [user, limit]);

  return { hashtags, loading, refetch: fetchTrendingHashtags };
}
