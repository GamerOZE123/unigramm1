
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import PostCard from '@/components/post/PostCard';
import AdvertisingPostCard from '@/components/advertising/AdvertisingPostCard';
import ImageUploadButton from '@/components/post/ImageUploadButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileHeader from '@/components/layout/MobileHeader';
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
  };
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
  const [seenPostIds, setSeenPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [userUniversity, setUserUniversity] = useState<string | null>(null);
  const [seenUniversityIds, setSeenUniversityIds] = useState<Set<string>>(new Set());
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 10;

  const fetchPosts = async (pageNum: number = 0, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const startIndex = pageNum * POSTS_PER_PAGE;
      const endIndex = startIndex + POSTS_PER_PAGE - 1;

      // Fetch user's university on initial load
      let currentUserUniversity = userUniversity;
      if (isInitial && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('university')
          .eq('user_id', user.id)
          .single();
        
        currentUserUniversity = profile?.university || null;
        setUserUniversity(currentUserUniversity);
      }

      // Calculate counts for 40:60 ratio
      const universityCount = Math.ceil(POSTS_PER_PAGE * 0.4);
      const globalCount = POSTS_PER_PAGE - universityCount;

      // Fetch university posts with pagination
      let universityPosts: TransformedPost[] = [];
      if (currentUserUniversity) {
        const { data: uniPostsData, error: uniError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(startIndex, startIndex + (universityCount * 3) - 1); // Fetch more to filter

        if (uniError) throw uniError;

        if (uniPostsData) {
          const uniUserIds = [...new Set(uniPostsData.map(post => post.user_id))];
          const { data: uniProfiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, university, major, avatar_url')
            .in('user_id', uniUserIds);

          const uniProfilesMap = new Map();
          uniProfiles?.forEach(profile => uniProfilesMap.set(profile.user_id, profile));

          universityPosts = uniPostsData
            .filter(post => uniProfilesMap.get(post.user_id)?.university === currentUserUniversity)
            .slice(0, universityCount) // Take only what we need
            .map(post => {
              const profile = uniProfilesMap.get(post.user_id);
              return {
                id: post.id,
                content: post.content || '',
                image_url: post.image_url,
                image_urls: post.image_urls,
                created_at: post.created_at,
                likes_count: post.likes_count || 0,
                comments_count: post.comments_count || 0,
                views_count: post.views_count || 0,
                user_id: post.user_id,
                user_name: profile?.full_name || profile?.username || 'Anonymous',
                user_username: profile?.username || 'user',
                user_university: profile?.university,
                hashtags: post.hashtags || [],
                profiles: {
                  full_name: profile?.full_name || 'Anonymous',
                  username: profile?.username || 'user',
                  avatar_url: profile?.avatar_url
                }
              };
            });
        }
      }

      // Fetch global posts with pagination
      const { data: globalPostsData, error: globalError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + (globalCount * 2) - 1); // Fetch more to filter

      if (globalError) throw globalError;

      let globalPosts: TransformedPost[] = [];
      if (globalPostsData) {
        const globalUserIds = [...new Set(globalPostsData.map(post => post.user_id))];
        const { data: globalProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, university, major, avatar_url')
          .in('user_id', globalUserIds);

        const globalProfilesMap = new Map();
        globalProfiles?.forEach(profile => globalProfilesMap.set(profile.user_id, profile));

        let allGlobalPosts = globalPostsData.map(post => {
          const profile = globalProfilesMap.get(post.user_id);
          const ageInHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
          const recencyScore = Math.max(0, 100 - ageInHours);
          const engagementScore = (post.likes_count * 2) + (post.comments_count * 3) + (post.views_count * 0.1);
          const randomFactor = Math.random() * 20;
          
          return {
            id: post.id,
            content: post.content || '',
            image_url: post.image_url,
            image_urls: post.image_urls,
            created_at: post.created_at,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            views_count: post.views_count || 0,
            user_id: post.user_id,
            user_name: profile?.full_name || profile?.username || 'Anonymous',
            user_username: profile?.username || 'user',
            user_university: profile?.university,
            hashtags: post.hashtags || [],
            profiles: {
              full_name: profile?.full_name || 'Anonymous',
              username: profile?.username || 'user',
              avatar_url: profile?.avatar_url
            },
            score: recencyScore + engagementScore + randomFactor
          };
        });

        // Filter out university posts from global
        if (currentUserUniversity) {
          allGlobalPosts = allGlobalPosts.filter(post => post.user_university !== currentUserUniversity);
        }

        // Sort and take only what we need
        globalPosts = allGlobalPosts
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, globalCount);
      }

      // Fetch ads only on first page
      let shuffledAds: any[] = [];
      if (pageNum === 0) {
        const { data: adsData } = await supabase
          .from('advertising_posts')
          .select('*')
          .eq('is_active', true);

        if (adsData && adsData.length > 0) {
          const companyIds = [...new Set(adsData.map((ad: any) => ad.company_id))];
          const { data: companyProfiles } = await supabase
            .from('company_profiles')
            .select('user_id, company_name, logo_url')
            .in('user_id', companyIds);

          shuffledAds = adsData.map((ad: any) => ({
            ...ad,
            company_profiles: companyProfiles?.find(cp => cp.user_id === ad.company_id) || null
          })).sort(() => Math.random() - 0.5);
        }
      }

      // Mix posts in 40:60 ratio
      const mixedArray: MixedPost[] = [];
      let uniIndex = 0;
      let globalIndex = 0;

      while (uniIndex < universityPosts.length || globalIndex < globalPosts.length) {
        // Add 4 university posts
        for (let i = 0; i < 4 && uniIndex < universityPosts.length; i++) {
          mixedArray.push({ type: 'regular', data: universityPosts[uniIndex] });
          uniIndex++;
        }
        // Add 6 global posts
        for (let i = 0; i < 6 && globalIndex < globalPosts.length; i++) {
          mixedArray.push({ type: 'regular', data: globalPosts[globalIndex] });
          globalIndex++;
        }
      }

      // Insert ad on first batch
      if (pageNum === 0 && shuffledAds.length > 0 && mixedArray.length >= 9) {
        mixedArray.splice(9, 0, { type: 'advertising', data: shuffledAds[0] });
      }

      // Determine if there are more posts (if we got the full amount we requested)
      const gotFullBatch = universityPosts.length >= universityCount || globalPosts.length >= globalCount;
      setHasMore(gotFullBatch && mixedArray.length > 0);

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
    }
  };

  const loadMorePosts = () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, false);
  };

  // Set up real-time subscription and initial load
  useEffect(() => {
    fetchPosts(0, true);

    const channel = supabase
      .channel('posts_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          setPage(0);
          fetchPosts(0, true);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        () => {
          setPage(0);
          fetchPosts(0, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        <div className="space-y-4">
          {mixedPosts.length > 0 ? (
            mixedPosts.map((mixedPost) =>
              mixedPost.type === 'regular' ? (
                <PostCard 
                  key={`regular-${mixedPost.data.id}`}
                  post={mixedPost.data as TransformedPost} 
                  onPostUpdated={() => fetchPosts(0, true)}
                />
              ) : (
                <AdvertisingPostCard
                  key={`ad-${mixedPost.data.id}`}
                  post={mixedPost.data as AdvertisingPost}
                  onLikeUpdate={() => fetchPosts(0, true)}
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
      
      <ImageUploadButton onPostCreated={() => fetchPosts(0, true)} />
    </Layout>
  );
}
