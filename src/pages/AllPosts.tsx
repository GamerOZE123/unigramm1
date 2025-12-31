import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import PostCard from '@/components/post/PostCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AllPosts() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const hasFetched = useRef(false);
  const POSTS_PER_PAGE = 20;

  const fetchPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const from = (pageNum - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Select only needed columns (no poll_end_date)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, user_id, content, image_url, image_urls, likes_count, comments_count, views_count, created_at, hashtags, poll_options, poll_question, survey_questions, startup_id')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        if (pageNum === 1) setPosts([]);
        setLoading(false);
        return;
      }

      // Batch fetch profiles instead of N+1
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, full_name, university')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, {
          username: p.username || 'Unknown User',
          avatar_url: p.avatar_url,
          full_name: p.full_name || 'Unknown User',
          university: p.university
        }])
      );

      const postsWithProfiles = postsData.map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || {
          username: 'Unknown User',
          avatar_url: null,
          full_name: 'Unknown User',
          university: null
        }
      }));

      if (pageNum === 1) {
        setPosts(postsWithProfiles);
      } else {
        setPosts(prev => [...prev, ...postsWithProfiles]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPosts(1);
    }
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const content = (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/explore')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">All Posts</h1>
      </div>

      {loading && page === 1 ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading posts...</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                onPostUpdated={() => {
                  hasFetched.current = false;
                  fetchPosts(1);
                }}
              />
            ))}
          </div>

          {posts.length > 0 && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <Layout>{content}</Layout>
  );
}
