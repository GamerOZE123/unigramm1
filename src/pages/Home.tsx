
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
  const [seenPostIds, setSeenPostIds] = useState<Set<string>>(() => {
    // Load seen posts from localStorage on mount
    const stored = localStorage.getItem('seenPostIds');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [userProfile, setUserProfile] = useState<{ university?: string; major?: string; country?: string; state?: string } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 10;
  const isFetchingRef = React.useRef(false);

  // Save seenPostIds to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('seenPostIds', JSON.stringify([...seenPostIds]));
  }, [seenPostIds]);

  const fetchPosts = async (pageNum: number = 0, isInitial: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (isInitial) {
        setLoading(true);
        // Don't reset seenPostIds on refresh - it's persisted in localStorage
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

      // Fetch ALL posts with pagination using ranking algorithm
      const { data: allPostsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex);

      if (postsError) throw postsError;

      let rankedPosts: TransformedPost[] = [];
      if (allPostsData) {
        const userIds = [...new Set(allPostsData.map(post => post.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, university, major, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map();
        profiles?.forEach(profile => profilesMap.set(profile.user_id, profile));

        // Apply ranking algorithm to ALL posts
        rankedPosts = allPostsData.map(post => {
          const profile = profilesMap.get(post.user_id);
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
        }).sort((a, b) => (b.score || 0) - (a.score || 0));
      }

      // Fetch targeted ads only on first page
      let targetedAds: any[] = [];
      if (pageNum === 0) {
        const { data: adsData } = await supabase
          .from('advertising_posts')
          .select('*')
          .eq('is_active', true);

        if (adsData && adsData.length > 0 && currentUserProfile) {
          // Filter ads based on targeting criteria
          const matchingAds = adsData.filter((ad: any) => {
            // If no targeting is set, show to everyone
            const hasNoTargeting = 
              (!ad.target_universities || ad.target_universities.length === 0) &&
              (!ad.target_majors || ad.target_majors.length === 0) &&
              (!ad.target_locations || ad.target_locations.length === 0);
            
            if (hasNoTargeting) return true;

            // Check if user matches any targeting criteria
            let matches = false;

            // University targeting
            if (ad.target_universities && ad.target_universities.length > 0 && currentUserProfile.university) {
              matches = matches || ad.target_universities.includes(currentUserProfile.university);
            }

            // Major targeting
            if (ad.target_majors && ad.target_majors.length > 0 && currentUserProfile.major) {
              matches = matches || ad.target_majors.includes(currentUserProfile.major);
            }

            // Location targeting
            if (ad.target_locations && ad.target_locations.length > 0 && currentUserProfile.country && currentUserProfile.state) {
              const userLocation = `${currentUserProfile.state}, ${currentUserProfile.country}`;
              matches = matches || ad.target_locations.some((loc: string) => 
                userLocation.toLowerCase().includes(loc.toLowerCase())
              );
            }

            return matches;
          });

          // Fetch company profiles for matching ads
          const companyIds = [...new Set(matchingAds.map((ad: any) => ad.company_id))];
          const { data: companyProfiles } = await supabase
            .from('company_profiles')
            .select('user_id, company_name, logo_url')
            .in('user_id', companyIds);

          targetedAds = matchingAds.map((ad: any) => ({
            ...ad,
            company_profiles: companyProfiles?.find(cp => cp.user_id === ad.company_id) || null
          })).sort(() => Math.random() - 0.5);
        }
      }

      // Convert ranked posts to MixedPost format
      let mixedArray: MixedPost[] = rankedPosts.map(post => ({
        type: 'regular',
        data: post
      }));

      // Insert ads every 3-4 posts (randomly alternate between 3 and 4)
      if (pageNum === 0 && targetedAds.length > 0) {
        let adIndex = 0;
        let postCount = 0;
        const insertInterval = () => Math.random() > 0.5 ? 3 : 4; // Randomly 3 or 4 posts
        let nextInsertPosition = insertInterval();

        const finalMixedArray: MixedPost[] = [];
        
        for (let i = 0; i < mixedArray.length; i++) {
          finalMixedArray.push(mixedArray[i]);
          postCount++;

          // Insert ad after every 3-4 posts
          if (postCount === nextInsertPosition && adIndex < targetedAds.length) {
            finalMixedArray.push({ 
              type: 'advertising', 
              data: targetedAds[adIndex] 
            });
            adIndex++;
            postCount = 0;
            nextInsertPosition = insertInterval(); // Next random interval
          }
        }

        mixedArray = finalMixedArray;
      }

      // Filter out posts we've already seen to prevent duplicates
      const newSeenIds = new Set(seenPostIds);
      const uniqueMixedArray = mixedArray.filter(post => {
        const postId = post.data.id;
        if (newSeenIds.has(postId)) {
          return false;
        }
        newSeenIds.add(postId);
        return true;
      });
      
      setSeenPostIds(newSeenIds);

      // Determine if there are more posts (if we got the full amount we requested)
      const gotFullBatch = rankedPosts.length >= POSTS_PER_PAGE;
      setHasMore(gotFullBatch && uniqueMixedArray.length > 0);

      // If no new posts and we've seen everything, clear seen posts to start fresh
      if (uniqueMixedArray.length === 0 && rankedPosts.length > 0) {
        console.log('All posts seen, clearing history');
        localStorage.removeItem('seenPostIds');
        setSeenPostIds(new Set());
        // Retry fetching without filtering
        if (isInitial) {
          const freshPosts = mixedArray.slice(0, POSTS_PER_PAGE).map(post => ({
            type: post.type,
            data: post.data
          }));
          setMixedPosts(freshPosts as MixedPost[]);
          setHasMore(mixedArray.length > POSTS_PER_PAGE);
          return;
        }
      }

      if (isInitial) {
        setMixedPosts(uniqueMixedArray);
      } else {
        setMixedPosts(prev => [...prev, ...uniqueMixedArray]);
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
