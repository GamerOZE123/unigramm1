import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// ============= TYPES =============

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface SurveyQuestion {
  id: string;
  question: string;
  type: "rating" | "multiple_choice" | "text";
  options?: string[];
}

export interface TransformedPost {
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
  poll_question?: string;
  poll_options?: PollOption[];
  poll_ends_at?: string;
  survey_questions?: SurveyQuestion[];
  score?: number;
  startup_id?: string;
  startup?: {
    title: string;
  };
}

export interface AdvertisingPost {
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
  target_universities?: string[];
  target_majors?: string[];
  target_years?: string[];
  target_locations?: string[];
  priority_placement?: boolean;
  company_profiles?: {
    company_name: string;
    logo_url?: string;
  };
}

export interface MixedPost {
  type: "regular" | "advertising";
  data: TransformedPost | AdvertisingPost;
}

interface UserProfile {
  university?: string;
  major?: string;
  country?: string;
  state?: string;
}

// ============= CONSTANTS =============

const MAX_SEEN_POSTS = 500;
const SEEN_POSTS_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const POSTS_PER_PAGE = 10;
const INITIAL_FETCH_SIZE = 50; // Fetch more posts initially to properly prioritize unseen

// ============= HELPER FUNCTIONS =============

/**
 * Load seen post IDs from localStorage with expiry check
 */
const loadSeenPostIds = (): Set<string> => {
  if (typeof window === "undefined") return new Set();

  const stored = localStorage.getItem("seenPostIds");
  if (stored) {
    try {
      const data = JSON.parse(stored);
      const isExpired = Date.now() - data.timestamp > SEEN_POSTS_EXPIRY;

      if (!isExpired && data.ids) {
        const ids = data.ids.slice(-MAX_SEEN_POSTS);
        return new Set(ids);
      }
    } catch (e) {
      console.error("Failed to parse seen posts:", e);
    }
  }
  return new Set();
};

/**
 * Save seen post IDs to localStorage with timestamp
 */
const saveSeenPostIds = (seenPostIds: Set<string>) => {
  if (typeof window === "undefined") return;

  const seenPostsData = {
    ids: Array.from(seenPostIds).slice(-MAX_SEEN_POSTS),
    timestamp: Date.now(),
  };
  localStorage.setItem("seenPostIds", JSON.stringify(seenPostsData));
};

/**
 * Transform raw post data from ranked_posts view to TransformedPost
 */
const transformPost = (post: any, startupsMap: Record<string, any> = {}): TransformedPost => ({
  id: post.id,
  content: post.content || "",
  image_url: post.image_url,
  image_urls: post.image_urls,
  created_at: post.created_at,
  updated_at: post.updated_at,
  likes_count: post.likes_count || 0,
  comments_count: post.comments_count || 0,
  views_count: post.views_count || 0,
  user_id: post.user_id,
  user_name: post.full_name || post.username || "Anonymous",
  user_username: post.username || "user",
  user_university: post.university,
  hashtags: post.hashtags || [],
  profiles: {
    full_name: post.full_name || "Anonymous",
    username: post.username || "user",
    avatar_url: post.avatar_url,
    university: post.university,
  },
  score: post.score,
  startup_id: post.startup_id,
  startup: post.startup_id && startupsMap[post.startup_id] ? { title: startupsMap[post.startup_id].title } : undefined,
  poll_question: post.poll_question,
  poll_options: post.poll_options,
  poll_ends_at: post.poll_ends_at,
  survey_questions: post.survey_questions,
});

/**
 * Separate posts into unseen and seen, prioritizing unseen posts
 * Unseen posts appear first (maintain their score order), then seen posts at the end
 */
const prioritizeUnseenPosts = (
  posts: TransformedPost[],
  seenPostIds: Set<string>,
  existingPosts: TransformedPost[] = [],
): { prioritizedPosts: TransformedPost[]; newSeenIds: Set<string> } => {
  const newSeenIds = new Set(seenPostIds);
  const existingPostIds = new Set(existingPosts.map((p) => p.id));

  // Filter out duplicates that are already in the feed
  const newPosts = posts.filter((post) => !existingPostIds.has(post.id));

  const unseenPosts: TransformedPost[] = [];
  const seenPosts: TransformedPost[] = [];

  newPosts.forEach((post) => {
    if (newSeenIds.has(post.id)) {
      seenPosts.push(post);
    } else {
      unseenPosts.push(post);
    }
  });

  // Mark all posts as seen for future reference
  newPosts.forEach((post) => newSeenIds.add(post.id));

  // Return unseen first, then seen - both maintain their original score order
  return {
    prioritizedPosts: [...unseenPosts, ...seenPosts],
    newSeenIds,
  };
};

/**
 * Interleave ads into posts array with stable placement
 * No ad in first 2 posts, then every 5 posts
 */
const interleaveAds = (posts: MixedPost[], ads: AdvertisingPost[]): MixedPost[] => {
  if (ads.length === 0 || posts.length <= 2) return posts;

  const result: MixedPost[] = [];
  let adIndex = 0;

  for (let i = 0; i < posts.length; i++) {
    result.push(posts[i]);

    // Insert ad after every 5 posts, but skip first 2 positions
    if (i >= 1 && (i + 1) % 5 === 0 && adIndex < ads.length) {
      result.push({
        type: "advertising",
        data: ads[adIndex],
      });
      adIndex++;
    }
  }

  return result;
};

/**
 * Apply author diversity: avoid more than 2 posts in a row from same author
 */
const applyAuthorDiversity = (posts: MixedPost[]): MixedPost[] => {
  const result = [...posts];
  let streakAuthor: string | null = null;
  let streakCount = 0;

  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    if (item.type !== "regular") {
      streakAuthor = null;
      streakCount = 0;
      continue;
    }

    const postData = item.data as TransformedPost;
    const authorId = postData.user_id;

    if (authorId === streakAuthor) {
      streakCount += 1;
    } else {
      streakAuthor = authorId;
      streakCount = 1;
    }

    if (streakCount > 2) {
      // find next post with a different author and swap
      let swapIndex = i + 1;
      while (swapIndex < result.length) {
        const candidate = result[swapIndex];
        if (candidate.type === "regular" && (candidate.data as TransformedPost).user_id !== streakAuthor) {
          const temp = result[i];
          result[i] = result[swapIndex];
          result[swapIndex] = temp;
          streakCount = 1; // reset streak for new author at position i
          break;
        }
        swapIndex++;
      }
    }
  }

  return result;
};

/**
 * Fetch posts from ranked_posts view based on view mode
 */
const fetchPostsFromDB = async (
  viewMode: "global" | "university",
  userProfile: UserProfile | null,
  startIndex: number,
  endIndex: number,
) => {
  let query = (supabase as any).from("ranked_posts").select("*");

  if (viewMode === "global") {
    query = query.eq("visibility", "global");
  } else if (viewMode === "university" && userProfile?.university) {
    query = query.eq("visibility", "university").eq("university", userProfile.university);
  }

  const { data, error } = await query.order("score", { ascending: false }).range(startIndex, endIndex);

  return { data, error };
};

/**
 * Fetch startup info for posts that have startup_id
 */
const fetchStartupsForPosts = async (posts: any[]): Promise<Record<string, any>> => {
  const startupIds = posts?.filter((p) => p.startup_id).map((p) => p.startup_id) || [];

  if (startupIds.length === 0) return {};

  const { data: startupData } = await supabase.from("student_startups").select("id, title").in("id", startupIds);

  if (!startupData) return {};

  return startupData.reduce((acc: Record<string, any>, startup: any) => {
    acc[startup.id] = startup;
    return acc;
  }, {});
};

/**
 * Fetch targeted ads based on user profile
 */
const fetchTargetedAds = async (userProfile: UserProfile | null): Promise<AdvertisingPost[]> => {
  try {
    // Fetch all active ads first
    const { data: adsData, error } = await supabase
      .from("advertising_posts")
      .select("*")
      .eq("is_active", true)
      .order("priority_placement", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching ads:", error);
      return [];
    }

    if (!adsData || adsData.length === 0) return [];

    // Fetch company profiles for the ads
    const companyIds = [...new Set(adsData.map((ad) => ad.company_id))];
    const { data: companiesData } = await supabase
      .from("company_profiles")
      .select("user_id, company_name, logo_url")
      .in("user_id", companyIds);

    const companiesMap = (companiesData || []).reduce((acc: Record<string, any>, company: any) => {
      acc[company.user_id] = company;
      return acc;
    }, {});

    // Transform ads with company info
    const adsWithCompany: AdvertisingPost[] = adsData.map((ad) => ({
      ...ad,
      company_profiles: companiesMap[ad.company_id] || {
        company_name: "Advertiser",
        logo_url: null,
      },
    }));

    // Filter by targeting if user profile exists
    if (userProfile) {
      return adsWithCompany.filter((ad) => {
        const matchesUniversity =
          !ad.target_universities ||
          ad.target_universities.length === 0 ||
          (userProfile.university && ad.target_universities.includes(userProfile.university));

        const matchesMajor =
          !ad.target_majors ||
          ad.target_majors.length === 0 ||
          (userProfile.major && ad.target_majors.includes(userProfile.major));

        return matchesUniversity && matchesMajor;
      });
    }

    // Return all ads if no user profile (show untargeted ads)
    return adsWithCompany.filter(
      (ad) =>
        (!ad.target_universities || ad.target_universities.length === 0) &&
        (!ad.target_majors || ad.target_majors.length === 0),
    );
  } catch (error) {
    console.error("Error in fetchTargetedAds:", error);
    return [];
  }
};

// ============= MAIN HOOK =============

export function useHomePosts(user: User | null) {
  const [mixedPosts, setMixedPosts] = useState<MixedPost[]>([]);
  const [seenPostIds, setSeenPostIds] = useState<Set<string>>(loadSeenPostIds);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [pendingNewPosts, setPendingNewPosts] = useState<TransformedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"global" | "university">("global");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const isFetchingRef = useRef(false);

  // Persist seen post IDs to localStorage
  useEffect(() => {
    saveSeenPostIds(seenPostIds);
  }, [seenPostIds]);

  // Main fetch function
  const fetchPosts = async (pageNum: number = 0, isInitial: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const fetchSize = isInitial ? INITIAL_FETCH_SIZE : POSTS_PER_PAGE;
      // After initial load, offset by INITIAL_FETCH_SIZE, then paginate normally
      const startIndex = isInitial ? 0 : INITIAL_FETCH_SIZE + (pageNum - 1) * POSTS_PER_PAGE;
      const endIndex = startIndex + fetchSize - 1;

      // Fetch user profile for ad targeting on initial load
      let currentUserProfile = userProfile;
      if (isInitial && user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("university, major, country, state")
          .eq("user_id", user.id)
          .single();

        currentUserProfile = profile || null;
        setUserProfile(currentUserProfile);
      }

      // Fetch posts
      const { data: postsData, error: postsError } = await fetchPostsFromDB(
        viewMode,
        currentUserProfile,
        startIndex,
        endIndex,
      );

      if (postsError) throw postsError;

      // Fetch startups for posts
      const startupsMap = await fetchStartupsForPosts(postsData || []);

      // Transform posts
      let transformedPosts: TransformedPost[] = (postsData || []).map((post: any) => transformPost(post, startupsMap));

      // Sort by DB / view score descending
      transformedPosts.sort((a, b) => (b.score || 0) - (a.score || 0));

      // Remove posts already seen in this browser (7-day window)
      transformedPosts = transformedPosts.filter((post) => !seenPostIds.has(post.id));

      // Get existing regular posts to avoid duplicates
      const existingRegularPosts = isInitial
        ? []
        : mixedPosts
            .filter(
              (
                p,
              ): p is MixedPost & {
                type: "regular";
                data: TransformedPost;
              } => p.type === "regular",
            )
            .map((p) => p.data as TransformedPost);

      // Prioritize unseen posts and filter duplicates
      const { prioritizedPosts, newSeenIds } = prioritizeUnseenPosts(
        transformedPosts,
        seenPostIds,
        existingRegularPosts,
      );

      // Log impressions to DB (cross-device)
      try {
        const impressionIds = prioritizedPosts.map((p) => p.id);
        if (impressionIds.length > 0 && user) {
          const impressions = impressionIds.map((postId) => ({
            post_id: postId,
            user_id: user.id,
          }));
          const { error: impressionError } = await supabase
            .from("post_impressions")
            .upsert(impressions, { onConflict: "post_id,user_id", ignoreDuplicates: true });
          if (impressionError) {
            console.error("Error logging impressions:", impressionError);
          }
        }
      } catch (e) {
        console.error("Failed to log impressions:", e);
      }

      // Convert to MixedPost format
      let mixedArray: MixedPost[] = prioritizedPosts.map((post) => ({
        type: "regular" as const,
        data: post,
      }));

      // Apply author diversity before ads
      mixedArray = applyAuthorDiversity(mixedArray);

      // Fetch and interleave ads on first page only
      if (pageNum === 0) {
        const targetedAds = await fetchTargetedAds(currentUserProfile);
        mixedArray = interleaveAds(mixedArray, targetedAds);
      }

      setSeenPostIds(newSeenIds);
      setHasMore(transformedPosts.length >= fetchSize);

      if (isInitial) {
        setMixedPosts(mixedArray);
      } else {
        setMixedPosts((prev) => [...prev, ...mixedArray]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  // Load more posts for infinite scroll
  const loadMorePosts = () => {
    if (loadingMore || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, false);
  };

  // Load new pending posts into feed
  const loadNewPosts = () => {
    if (pendingNewPosts.length === 0) return;

    const newMixedPosts: MixedPost[] = pendingNewPosts.map((post) => ({
      type: "regular" as const,
      data: post,
    }));

    setMixedPosts((prev) => [...newMixedPosts, ...prev]);
    setPendingNewPosts([]);
    setNewPostsAvailable(false);

    // Mark new posts as seen
    const newIds = pendingNewPosts.map((p) => p.id);
    setSeenPostIds((prev) => new Set([...Array.from(prev), ...newIds]));
  };

  // Switch view mode and refresh
  const switchViewMode = (mode: "global" | "university") => {
    setViewMode(mode);
    setPage(0);
    setMixedPosts([]);
    fetchPosts(0, true);
  };

  // Initial load
  useEffect(() => {
    fetchPosts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("home-posts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, async (payload) => {
        try {
          const { data: newPost, error: postError } = await supabase
            .from("ranked_posts")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (postError || !newPost) return;

          const transformedPost = transformPost(newPost);

          // If already seen in this browser, skip adding as "new"
          if (seenPostIds.has(transformedPost.id)) return;

          setPendingNewPosts((prev) => [transformedPost, ...prev]);
          setNewPostsAvailable(true);
        } catch (error) {
          console.error("Error handling new post:", error);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, (payload) => {
        setMixedPosts((prev) =>
          prev.map((item) => {
            if (item.type === "regular" && item.data.id === payload.new.id) {
              const postData = item.data as TransformedPost;
              return {
                ...item,
                data: {
                  ...postData,
                  likes_count: (payload.new as any).likes_count ?? postData.likes_count,
                  comments_count: (payload.new as any).comments_count ?? postData.comments_count,
                  views_count: (payload.new as any).views_count ?? postData.views_count,
                  content: (payload.new as any).content ?? postData.content,
                },
              };
            }
            return item;
          }),
        );
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (payload) => {
        setMixedPosts((prev) => prev.filter((item) => item.type !== "regular" || item.data.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, seenPostIds]);

  // Infinite scroll handler
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

        setTimeout(() => {
          isScrolling = false;
        }, 1000);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadingMore, hasMore, page]);

  return {
    mixedPosts,
    loading,
    loadingMore,
    hasMore,
    viewMode,
    newPostsAvailable,
    pendingNewPosts,
    switchViewMode,
    loadNewPosts,
    loadMorePosts,
    refetch: () => fetchPosts(0, true),
  };
}
