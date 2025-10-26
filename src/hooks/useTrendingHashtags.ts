
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrendingHashtag {
  hashtag: string;
  post_count: number;
  unique_users: number;
  last_used: string;
  trend_score: number;
}

const TIME_WEIGHT_HOURS = 3; // Posts within last 3 hours are heavily weighted
const SCORE_DECAY_RATE = 0.5; // How much older posts decay

export const useTrendingHashtags = () => {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      // Calculate time-based weight
      // Recent posts (< TIME_WEIGHT_HOURS) get full weight
      // Older posts decay exponentially
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

    // Convert to array and sort by trend score
    return Array.from(hashtagData.entries())
      .map(([hashtag, data]) => ({
        hashtag,
        post_count: data.postCount,
        unique_users: data.uniqueUsers.size,
        last_used: data.lastUsed,
        trend_score: data.totalScore
      }))
      .filter(tag => tag.trend_score > 0.1) // Filter out extremely low scores
      .sort((a, b) => b.trend_score - a.trend_score)
      .slice(0, 5);
  };

  const fetchTrendingHashtags = async () => {
    try {
      // Fetch posts from last 7 days (gives us data but recent posts will score higher)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('hashtags, user_id, created_at')
        .not('hashtags', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      const trendingHashtags = calculateTrendScore(postsData || []);
      setHashtags(trendingHashtags);
    } catch (error) {
      console.error('Error in fetchTrendingHashtags:', error);
      setHashtags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingHashtags();
    
    // Refresh trending hashtags every 5 minutes to reflect new activity
    const interval = setInterval(fetchTrendingHashtags, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { hashtags, loading, refetch: fetchTrendingHashtags };
};

