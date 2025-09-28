import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import PostCard from '@/components/post/PostCard';
import AdvertisingPostCardFixed from '@/components/advertising/AdvertisingPostCardFixed';
import ImageUploadButton from '@/components/post/ImageUploadButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

export default function HomeFixed() {
  const [mixedPosts, setMixedPosts] = useState<any[]>([]);
  const [seenPostIds, setSeenPostIds] = useState(new Set<string>());
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // Fetch regular posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            avatar_url,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      // Fetch advertising posts
      const { data: adPostsData, error: adPostsError } = await supabase
        .from('advertising_posts')
        .select(`
          *,
          company_profiles (
            company_name,
            company_logo
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (adPostsError) throw adPostsError;

      // Transform regular posts
      const transformedPosts = (postsData || []).map((post: any) => ({
        ...post,
        type: 'regular',
        author: {
          username: post.profiles?.username || 'Unknown User',
          avatar_url: post.profiles?.avatar_url || null,
          full_name: post.profiles?.full_name || 'Unknown User'
        }
      }));

      // Transform advertising posts
      const transformedAdPosts = (adPostsData || []).map((post: any) => ({
        ...post,
        type: 'advertising',
        company_name: post.company_profiles?.company_name || 'Company',
        company_logo: post.company_profiles?.company_logo || null,
        views_count: 0,
        click_count: 0,
        likes_count: 0
      }));

      // Mix posts together
      const allPosts = [...transformedPosts, ...transformedAdPosts];
      allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setMixedPosts(allPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeUpdate = async () => {
    await fetchPosts();
  };

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscriptions
    const postsSubscription = supabase
      .channel('posts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => fetchPosts()
      )
      .subscribe();

    const adPostsSubscription = supabase
      .channel('advertising_posts_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'advertising_posts' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(adPostsSubscription);
    };
  }, []);

  const content = (
    <div className="container mx-auto py-6 space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {mixedPosts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Welcome to the feed!</h2>
              <p className="text-muted-foreground">
                Be the first to share something with the community.
              </p>
            </div>
          ) : (
            mixedPosts.map((post) => (
              post.type === 'advertising' ? (
                <div key={`ad-${post.id}`} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-muted-foreground">{post.content}</p>
                </div>
              ) : (
                <PostCard
                  key={`post-${post.id}`}
                  post={post}
                />
              )
            ))
          )}
        </div>
      )}
      
      <ImageUploadButton onPostCreated={fetchPosts} />
    </div>
  );

  return isMobile ? (
    <MobileLayout>
      <MobileHeader />
      {content}
    </MobileLayout>
  ) : (
    <Layout>{content}</Layout>
  );
}