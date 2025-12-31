import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { memoryCache } from '@/lib/cache';

interface TrendingHashtag {
  hashtag: string;
  post_count: number;
  unique_users: number;
  last_used: string;
  trend_score: number;
}

// Cache key and TTL for trending hashtags (10 minutes)
const TRENDING_HASHTAGS_CACHE_KEY = 'trending_hashtags_global';
const CACHE_TTL_MS = 10 * 60 * 1000;

const TIME_WEIGHT_HOURS = 3;
const SCORE_DECAY_RATE = 0.5;

export const useTrendingHashtags = () => {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const calculateTrendScore = (posts: Array<{ created_at: string; user_id: string; hashtags: string[] }>) => {
    const now = Date.now();
    const hashtagData = new Map<string, {
      totalScore: number;
      postCount: number;
      uniqueUsers: Set<string>;
      lastUsed: string;
    }>();

    posts.forEach(post => {
      const postTime = new Date(post.created_at).getTime();
      const hoursAgo = (now - postTime) / (1000 * 60 * 60);
      
      let timeWeight = 1;
      if (hoursAgo > TIME_WEIGHT_HOURS) {
        const decayHours = hoursAgo - TIME_WEIGHT_HOURS;
        timeWeight = Math.exp(-SCORE_DECAY_RATE * decayHours);
      }

      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((hashtag: string) => {
          const existing = hashtagData.get(hashtag) || {
            totalScore: 0,
            postCount: 0,
            uniqueUsers: new Set(),
            lastUsed: post.created_at
          };

          existing.totalScore += timeWeight;
          existing.postCount += 1;
          existing.uniqueUsers.add(post.user_id);
          
          if (new Date(post.created_at) > new Date(existing.lastUsed)) {
            existing.lastUsed = post.created_at;
          }

          hashtagData.set(hashtag, existing);
        });
      }
    });

    return Array.from(hashtagData.entries())
      .map(([hashtag, data]) => ({
        hashtag,
        post_count: data.postCount,
        unique_users: data.uniqueUsers.size,
        last_used: data.lastUsed,
        trend_score: data.totalScore
      }))
      .filter(tag => tag.post_count >= 1)
      .sort((a, b) => b.trend_score - a.trend_score)
      .slice(0, 5);
  };

  const fetchTrendingHashtags = async () => {
    try {
      // Check cache first
      const cached = memoryCache.get<TrendingHashtag[]>(TRENDING_HASHTAGS_CACHE_KEY);
      if (cached) {
        setHashtags(cached);
        setLoading(false);
        return;
      }

      // Fetch only recent posts (last 7 days) with LIMIT
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('hashtags, user_id, created_at')
        .not('hashtags', 'is', null)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(500); // CRITICAL: Prevent fetching all posts
      
      if (postsError) throw postsError;
      
      const trendingHashtags = calculateTrendScore(postsData || []);
      
      // Cache for 10 minutes
      memoryCache.set(TRENDING_HASHTAGS_CACHE_KEY, trendingHashtags, CACHE_TTL_MS);
      
      setHashtags(trendingHashtags);
    } catch (error) {
      console.error('Error in fetchTrendingHashtags:', error);
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once on mount - no more interval refetching
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTrendingHashtags();
    }
  }, []);

  return { hashtags, loading, refetch: fetchTrendingHashtags };
};
