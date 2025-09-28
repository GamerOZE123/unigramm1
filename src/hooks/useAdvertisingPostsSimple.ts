import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleAdvertisingPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  views_count?: number;
  click_count?: number;
  likes_count?: number;
  company_profiles?: {
    company_name: string;
    company_logo: string;
  };
}

export const useAdvertisingPostsSimple = () => {
  const [posts, setPosts] = useState<SimpleAdvertisingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('advertising_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedData = (data || []).map((post: any) => ({
        id: post.id,
        title: post.title || '',
        content: post.content || '',
        user_id: post.user_id,
        created_at: post.created_at,
        views_count: 0,
        click_count: 0,
        likes_count: 0,
        company_profiles: {
          company_name: 'Company',
          company_logo: ''
        }
      }));
      
      setPosts(transformedData);
    } catch (error) {
      console.error('Error fetching advertising posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return { posts, loading, refetch: fetchPosts };
};