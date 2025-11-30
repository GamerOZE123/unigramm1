
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import PostCard from '@/components/post/PostCard';
import AdvertisingPostCard from '@/components/advertising/AdvertisingPostCard';
import ImageUploadButton from '@/components/post/ImageUploadButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileHeader from '@/components/layout/MobileHeader';
import { cn } from '@/lib/utils';
// Re-importing to force refresh
import { useIsMobile } from '@/hooks/use-mobile';


interface PostData {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  hashtags?: string[];
  profiles: {
    full_name?: string;
    username?: string;
    university?: string;
    major?: string;
    avatar_url?: string;
  } | null;
}

interface TransformedPost {
  id: string;
  content: string;
  image_url?: string;
  image_urls?: string[];
  created_at: string;
  updated_at?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user_id: string;
  user_name: string;
  user_username: string;
  user_university?: string;
  hashtags?: string[];
  profiles?: {
    full_name: string;
    username: string;
    avatar_url?: string;
    university?: string;
  };
  score?: number;
}

interface AdvertisingPost {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  redirect_url: string;
  click_count: number;
  likes_count: number;
  views_count: number;
  created_at: string;
  company_id: string;
  company_profiles?: {
    company_name: string;
    logo_url?: string;
  };
}

interface MixedPost {
  type: 'regular' | 'advertising';
  data: TransformedPost | AdvertisingPost;
}

export default function Home() {
  const { user } = useAuth();
  const [mixedPosts, setMixedPosts] = useState<MixedPost[]>([]);
  
  const MAX_SEEN_POSTS = 500;
  const SEEN_POSTS_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  const [seenPostIds, setSeenPostIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('seenPostIds');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const isExpired = (Date.now() - data.timestamp) > SEEN_POSTS_EXPIRY;
        
        if (!isExpired && data.ids) {
          // Limit to last 500 posts
          const ids = data.ids.slice(-MAX_SEEN_POSTS);
          return new Set(ids);
        }
      } catch (e) {
        console.error('Failed to parse seen posts:', e);
      }
    }
    return new Set();
  });
  
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [pendingNewPosts, setPendingNewPosts] = useState<TransformedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [userProfile, setUserProfile] = useState<{ university?: string; major?: string; country?: string; state?: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 10;
  const isFetchingRef = React.useRef(false);
  const [viewMode, setViewMode] = useState<'global' | 'university'>('global');

  // Save seen post IDs to localStorage with timestamp and limit
  useEffect(() => {
    const seenPostsData = {
      ids: Array.from(seenPostIds).slice(-MAX_SEEN_POSTS),
      timestamp: Date.now()
    };
    localStorage.setItem('seenPostIds', JSON.stringify(seenPostsData));
  }, [seenPostIds]);

  const fetchPosts = async (pageNum: number = 0, isInitial: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const startIndex = pageNum * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE - 1;

      // Fetch user profile for ad targeting on initial load
      let currentUserProfile = userProfile;
      if (isInitial && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('university, major, country, state')
          .eq('user_id', user.id)
          .single();
        
        currentUserProfile = profile || null;
        setUserProfile(currentUserProfile);
      }

      // ✅ UPGRADE 1 & 3: Use single JOIN query - avoid TS type depth issue
      let allPostsData: any;
      let postsError: any;
      
      if (viewMode === 'global') {
        const r = await supabase.from('ranked_posts').select('*').eq('visibility', 'global').order('score', { ascending: false }).range(startIndex, endIndex);
        allPostsData = r.data; postsError = r.error;
      } else if (viewMode === 'university' && currentUserProfile?.university) {
        const r = await supabase.from('ranked_posts').select('*').eq('visibility', 'university').eq('university', currentUserProfile.university).order('score', { ascending: false }).range(startIndex, endIndex);
        allPostsData = r.data; postsError = r.error;
      } else {
        const r = await supabase.from('ranked_posts').select('*').order('score', { ascending: false }).range(startIndex, endIndex);
        allPostsData = r.data; postsError = r.error;
      }

      if (postsError) throw postsError;

      // Transform posts data (profiles are already joined)
      let rankedPosts: TransformedPost[] = [];
      if (allPostsData) {
        rankedPosts = allPostsData.map(post => ({
          id: post.id,
          content: post.content || '',
          image_url: post.image_url,
          image_urls: post.image_urls,
          created_at: post.created_at,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          views_count: post.views_count || 0,
          user_id: post.user_id,
          user_name: post.full_name || post.username || 'Anonymous',
          user_username: post.username || 'user',
          user_university: post.university,
          hashtags: post.hashtags || [],
          profiles: {
            full_name: post.full_name || 'Anonymous',
            username: post.username || 'user',
            avatar_url: post.avatar_url,
            university: post.university
          },
          score: post.score
        }));
      }

      // ✅ UPGRADE 4: SQL-based ad targeting
      let targetedAds: any[] = [];
      if (pageNum === 0 && currentUserProfile) {
        let adsQuery = supabase
          .from('advertising_posts')
          .select(`
            *,
            company_profiles:company_id(company_name, logo_url)
          `)
          .eq('is_active', true);

        // Apply SQL-level targeting filters
        if (currentUserProfile.university) {
          adsQuery = adsQuery.or(`target_universities.cs.{${currentUserProfile.university}},target_universities.is.null`);
        }
        if (currentUserProfile.major) {
          adsQuery = adsQuery.or(`target_majors.cs.{${currentUserProfile.major}},target_majors.is.null`);
        }

        const { data: adsData } = await adsQuery;
        targetedAds = adsData || [];
      }

      // Separate unseen and seen posts
      const newSeenIds = new Set(seenPostIds);
      const unseenPosts: typeof rankedPosts = [];
      const seenPosts: typeof rankedPosts = [];
      
      rankedPosts.forEach(post => {
        if (newSeenIds.has(post.id)) {
          seenPosts.push(post);
        } else {
          unseenPosts.push(post);
          newSeenIds.add(post.id);
        }
      });

      const postsToShow = [...unseenPosts, ...seenPosts];

      // Convert posts to MixedPost format
      let mixedArray: MixedPost[] = postsToShow.map(post => ({
        type: 'regular',
        data: post
      }));

      // ✅ UPGRADE 5: Stable ad placement - no ad in first 2 posts, then every 5 posts
      if (pageNum === 0 && targetedAds.length > 0 && mixedArray.length > 2) {
        const finalMixedArray: MixedPost[] = [];
        let adIndex = 0;
        
        for (let i = 0; i < mixedArray.length; i++) {
          finalMixedArray.push(mixedArray[i]);
          
          // Insert ad after every 5 posts, but skip first 2 positions
          if (i >= 1 && (i + 1) % 5 === 0 && adIndex < targetedAds.length) {
            finalMixedArray.push({ 
              type: 'advertising', 
              data: targetedAds[adIndex] 
            });
            adIndex++;
          }
        }
        
        mixedArray = finalMixedArray;
      }
      
      setSeenPostIds(newSeenIds);

      const gotFullBatch = rankedPosts.length >= POSTS_PER_PAGE;
      setHasMore(gotFullBatch);

      if (isInitial) {
        setMixedPosts(mixedArray);
      } else {
        setMixedPosts(prev => [...prev, ...mixedArray]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  const loadMorePosts = () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, false);
  };

  // Initial load only
  useEffect(() => {
    fetchPosts(0, true);
  }, []);

  // Real-time post updates
  useEffect(() => {
    const channel = supabase
      .channel('home-posts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          try {
            // Use ranked_posts view for consistency
            const { data: newPost, error: postError } = await supabase
              .from('ranked_posts')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (postError || !newPost) return;

            const transformedPost: TransformedPost = {
              id: newPost.id,
              user_id: newPost.user_id,
              content: newPost.content,
              image_url: newPost.image_url,
              image_urls: newPost.image_urls,
              created_at: newPost.created_at,
              updated_at: newPost.updated_at,
              likes_count: newPost.likes_count || 0,
              comments_count: newPost.comments_count || 0,
              views_count: newPost.views_count || 0,
              hashtags: newPost.hashtags || [],
              user_name: newPost.full_name || newPost.username || 'Anonymous',
              user_username: newPost.username || 'user',
              user_university: newPost.university,
              profiles: {
                full_name: newPost.full_name || 'Anonymous',
                username: newPost.username || 'user',
                avatar_url: newPost.avatar_url,
                university: newPost.university
              },
              score: newPost.score
            };

            setPendingNewPosts(prev => [transformedPost, ...prev]);
            setNewPostsAvailable(true);
          } catch (error) {
            console.error('Error handling new post:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          // ✅ UPGRADE 2: Update only changed fields
          setMixedPosts(prev => prev.map(item => {
            if (item.type === 'regular' && item.data.id === payload.new.id) {
              const postData = item.data as TransformedPost;
              return {
                ...item,
                data: {
                  ...postData,
                  likes_count: (payload.new as any).likes_count ?? postData.likes_count,
                  comments_count: (payload.new as any).comments_count ?? postData.comments_count,
                  views_count: (payload.new as any).views_count ?? postData.views_count,
                  content: (payload.new as any).content ?? postData.content
                }
              };
            }
            return item;
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          // Remove deleted post from feed
          setMixedPosts(prev => prev.filter(item => 
            item.type !== 'regular' || item.data.id !== payload.old.id
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  // Handler to load new posts
  const loadNewPosts = () => {
    if (pendingNewPosts.length === 0) return;

    // Merge pending posts into feed at the top (before any ads)
    const newMixedPosts: MixedPost[] = pendingNewPosts.map(post => ({
      type: 'regular' as const,
      data: post
    }));

    setMixedPosts(prev => [...newMixedPosts, ...prev]);
    setPendingNewPosts([]);
    setNewPostsAvailable(false);

    // Mark new posts as seen
    const newIds = pendingNewPosts.map(p => p.id);
    setSeenPostIds(prev => new Set([...Array.from(prev), ...newIds]));
  };

  // Infinite scroll with ref to prevent stale closures
  useEffect(() => {
    let isScrolling = false;

    const handleScroll = () => {
      if (isScrolling) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollTop + clientHeight >= scrollHeight - 800) {
        isScrolling = true;
        loadMorePosts();
        
        // Reset flag after a delay
        setTimeout(() => {
          isScrolling = false;
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto pt-2">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}
      
      <div className="max-w-xl mx-auto pt-6 -mt-4 md:pt-2 md:-mt-6">
        {/* Global/University Toggle */}
        <div className="flex justify-center gap-4 py-4 mb-4 sticky top-0 bg-background z-10 border-b border-border">
          <button
            onClick={() => {
              setViewMode('global');
              setPage(0);
              setMixedPosts([]);
              fetchPosts(0, true);
            }}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              viewMode === 'global'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => {
              setViewMode('university');
              setPage(0);
              setMixedPosts([]);
              fetchPosts(0, true);
            }}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              viewMode === 'university'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            University
          </button>
        </div>
        {/* New posts available banner */}
        {newPostsAvailable && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-primary">
              {pendingNewPosts.length} new {pendingNewPosts.length === 1 ? 'post' : 'posts'} available
            </span>
            <button 
              onClick={loadNewPosts}
              className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Load new posts
            </button>
          </div>
        )}
        
        <div className="space-y-4">
          {mixedPosts.length > 0 ? (
            mixedPosts.map((mixedPost) =>
              mixedPost.type === 'regular' ? (
                <PostCard 
                  key={`regular-${mixedPost.data.id}`}
                  post={mixedPost.data as TransformedPost} 
                />
              ) : (
                <AdvertisingPostCard
                  key={`ad-${mixedPost.data.id}`}
                  post={mixedPost.data as AdvertisingPost}
                />
              )
            )
          ) : (
            <div className="post-card text-center py-12">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Welcome to the Community!
              </h3>
              <p className="text-muted-foreground mb-4">
                No posts yet. Be the first to share something with your community!
              </p>
              <p className="text-sm text-muted-foreground">
                Click the + button below to create your first post.
              </p>
            </div>
          )}
          
          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
      
      <ImageUploadButton onPostCreated={() => {
        // ✅ UPGRADE 2: Realtime subscription handles new posts
      }} />
    </Layout>
  );
}
