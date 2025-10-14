import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrendingUniversity {
  university: string;
  post_count: number;
}

export const useTrendingUniversities = () => {
  const [universities, setUniversities] = useState<TrendingUniversity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendingUniversities = async () => {
    try {
      // Get all posts from the last 7 days with user profiles
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('user_id, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (postsError) throw postsError;

      // Get user profiles with universities
      const userIds = [...new Set(postsData?.map(post => post.user_id) || [])];
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

      setUniversities(trendingUniversities);
    } catch (error) {
      console.error('Error fetching trending universities:', error);
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingUniversities();
  }, []);

  return { universities, loading, refetch: fetchTrendingUniversities };
};
