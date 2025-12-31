import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { memoryCache } from '@/lib/cache';

interface TrendingUniversity {
  university: string;
  post_count: number;
}

// Cache key and TTL for trending universities (1 hour)
const TRENDING_UNIVERSITIES_CACHE_KEY = 'trending_universities_global';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const useTrendingUniversities = () => {
  const [universities, setUniversities] = useState<TrendingUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchTrendingUniversities = async () => {
    try {
      // Check cache first
      const cached = memoryCache.get<TrendingUniversity[]>(TRENDING_UNIVERSITIES_CACHE_KEY);
      if (cached) {
        setUniversities(cached);
        setLoading(false);
        return;
      }

      // Fetch recent posts only (last 30 days) with LIMIT
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1000); // CRITICAL: Limit to prevent fetching all posts
      
      if (postsError) throw postsError;

      // Get unique user IDs
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
      
      if (userIds.length === 0) {
        setUniversities([]);
        setLoading(false);
        return;
      }

      // Batch fetch profiles (only needed fields)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, university')
        .in('user_id', userIds)
        .not('university', 'is', null);
      
      if (profilesError) throw profilesError;

      // Create a map of user_id to university
      const userUniversityMap = new Map<string, string>();
      profilesData?.forEach(profile => {
        if (profile.university) {
          userUniversityMap.set(profile.user_id, profile.university);
        }
      });

      // Count posts per university
      const universityCountMap = new Map<string, number>();
      postsData?.forEach(post => {
        const university = userUniversityMap.get(post.user_id);
        if (university) {
          universityCountMap.set(
            university,
            (universityCountMap.get(university) || 0) + 1
          );
        }
      });

      // Convert to array and sort by post count
      const trendingUniversities: TrendingUniversity[] = Array.from(universityCountMap.entries())
        .map(([university, post_count]) => ({
          university,
          post_count
        }))
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, 5);

      // Cache for 1 hour
      memoryCache.set(TRENDING_UNIVERSITIES_CACHE_KEY, trendingUniversities, CACHE_TTL_MS);
      
      setUniversities(trendingUniversities);
    } catch (error) {
      console.error('Error fetching trending universities:', error);
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTrendingUniversities();
    }
  }, []);

  return { universities, loading, refetch: fetchTrendingUniversities };
};
