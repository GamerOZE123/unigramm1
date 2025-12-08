import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

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
  startup?: { title: string };
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

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const MAX_SEEN_POSTS = 500;
const SEEN_POSTS_EXPIRY = 7 * 24 * 60 * 60 * 1000;

const POSTS_PER_PAGE = 10;
const INITIAL_FETCH_SIZE = 50;

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const loadSeenPostIds = (): Set<string> => {
  if (typeof window === "undefined") return new Set();

  try {
    const stored = localStorage.getItem("seenPostIds");
    if (!stored) return new Set();

    const { ids, timestamp } = JSON.parse(stored);

    const expired = Date.now() - timestamp > SEEN_POSTS_EXPIRY;
    if (expired) return new Set();

    return new Set(ids.slice(-MAX_SEEN_POSTS));
  } catch {
    return new Set();
  }
};

const saveSeenPostIds = (ids: Set<string>) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    "seenPostIds",
    JSON.stringify({
      ids: Array.from(ids).slice(-MAX_SEEN_POSTS),
      timestamp: Date.now(),
    }),
  );
};

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

const prioritizeUnseenPosts = (posts: TransformedPost[], seenIds: Set<string>, existing: TransformedPost[]) => {
  const newSeen = new Set(seenIds);
  const existingIds = new Set(existing.map((p) => p.id));

  const filtered = posts.filter((p) => !existingIds.has(p.id));

  const unseen = filtered.filter((p) => !newSeen.has(p.id));
  const seen = filtered.filter((p) => newSeen.has(p.id));

  filtered.forEach((p) => newSeen.add(p.id));

  return { prioritizedPosts: [...unseen, ...seen], newSeenIds: newSeen };
};

const interleaveAds = (posts: MixedPost[], ads: AdvertisingPost[]): MixedPost[] => {
  if (ads.length === 0 || posts.length <= 2) return posts;

  const result: MixedPost[] = [];
  let adIndex = 0;

  for (let i = 0; i < posts.length; i++) {
    result.push(posts[i]);

    if (i >= 1 && (i + 1) % 5 === 0 && adIndex < ads.length) {
      result.push({ type: "advertising", data: ads[adIndex++] });
    }
  }

  return result;
};

const applyAuthorDiversity = (posts: MixedPost[]): MixedPost[] => {
  let streakUser: string | null = null;
  let streakCount = 0;

  const arr = [...posts];

  for (let i = 0; i < arr.length; i++) {
    if (arr[i].type !== "regular") {
      streakUser = null;
      streakCount = 0;
      continue;
    }

    const userId = (arr[i].data as TransformedPost).user_id;

    if (userId === streakUser) streakCount++;
    else {
      streakUser = userId;
      streakCount = 1;
    }

    if (streakCount > 2) {
      let swap = i + 1;
      while (swap < arr.length) {
        if (arr[swap].type === "regular" && (arr[swap].data as TransformedPost).user_id !== streakUser) {
          [arr[i], arr[swap]] = [arr[swap], arr[i]];
          streakCount = 1;
          break;
        }
        swap++;
      }
    }
  }

  return arr;
};

const fetchPostsFromDB = async (
  mode: "global" | "university",
  profile: UserProfile | null,
  start: number,
  end: number,
) => {
  let q = supabase.from("ranked_posts").select("*");

  if (mode === "global") q = q.eq("visibility", "global");
  else if (mode === "university" && profile?.university)
    q = q.eq("visibility", "university").eq("university", profile.university);

  return q.order("score", { ascending: false }).range(start, end);
};

const fetchStartupsForPosts = async (posts: any[]) => {
  const ids = posts?.filter((p) => p.startup_id).map((p) => p.startup_id) ?? [];
  if (ids.length === 0) return {};

  const { data } = await supabase.from("student_startups").select("id, title").in("id", ids);

  return (data ?? []).reduce((m: any, s: any) => {
    m[s.id] = s;
    return m;
  }, {});
};

const fetchTargetedAds = async (profile: UserProfile | null) => {
  const { data } = await supabase
    .from("advertising_posts")
    .select("*")
    .eq("is_active", true)
    .order("priority_placement", { ascending: false })
    .limit(10);

  if (!data) return [];

  const ids = [...new Set(data.map((a) => a.company_id))];
  const { data: companies } = await supabase.from("company_profiles").select("*").in("user_id", ids); // No overload matches error likely due to Supabase type inference on return array

  const map = (companies ?? []).reduce((m: any, c: any) => {
    m[c.user_id] = c;
    return m;
  }, {});

  const ads = data.map((a) => ({
    ...a,
    company_profiles: map[a.company_id] ?? { company_name: "Advertiser" },
  }));

  if (!profile) return ads;

  return ads.filter((a) => {
    const okUni =
      !a.target_universities ||
      a.target_universities.length === 0 ||
      a.target_universities.includes(profile.university ?? "");

    const okMajor = !a.target_majors || a.target_majors.length === 0 || a.target_majors.includes(profile.major ?? "");

    return okUni && okMajor;
  });
};

// --------------------------------------------------
// MAIN HOOK
// --------------------------------------------------

export function useHomePosts(user: User | null) {
  const [mixedPosts, setMixedPosts] = useState<MixedPost[]>([]);
  const [seenIds, setSeenIds] = useState(loadSeenPostIds);
  const [pendingNewPosts, setPending] = useState<TransformedPost[]>([]);
  const [newAvailable, setNewAvailable] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [viewMode, setViewMode] = useState<"global" | "university">("global");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetching = useRef(false);

  useEffect(() => saveSeenPostIds(seenIds), [seenIds]);

  // -----------------------------
  // FETCH POSTS
  // -----------------------------
  const fetchPosts = async (pageNum = 0, initial = false) => {
    if (fetching.current) return;
    fetching.current = true;

    try {
      initial ? setLoading(true) : setLoadingMore(true);

      const size = initial ? INITIAL_FETCH_SIZE : POSTS_PER_PAGE;
      const start = initial ? 0 : INITIAL_FETCH_SIZE + (pageNum - 1) * POSTS_PER_PAGE;
      const end = start + size - 1;

      // Fetch profile once
      let p = profile;
      if (initial && user) {
        const { data } = await supabase
          .from("profiles")
          .select("university, major, country, state")
          .eq("user_id", user.id)
          .single();

        setProfile(data ?? null);
        p = data;
      }

      const { data: posts } = await fetchPostsFromDB(viewMode, p, start, end);

      const startups = await fetchStartupsForPosts(posts ?? []);

      let transformed = (posts ?? []).map((p: any) => transformPost(p, startups));

      transformed.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      // REMOVE posts already seen in local storage
      transformed = transformed.filter((p) => !seenIds.has(p.id));

      const existing = initial
        ? []
        : mixedPosts.filter((x) => x.type === "regular").map((x) => x.data as TransformedPost);

      const { prioritizedPosts, newSeenIds } = prioritizeUnseenPosts(transformed, seenIds, existing);

      // Log impressions
      if (user && prioritizedPosts.length > 0) {
        await supabase.from("post_impressions").upsert(
          prioritizedPosts.map((p) => ({
            user_id: user.id,
            post_id: p.id,
            seen_at: new Date().toISOString(),
          })),
          { onConflict: ["user_id", "post_id"] },
        );
      }

      let mixed: MixedPost[] = prioritizedPosts.map((p) => ({
        type: "regular",
        data: p,
      }));

      mixed = applyAuthorDiversity(mixed);

      if (pageNum === 0) {
        const ads = await fetchTargetedAds(p);
        mixed = interleaveAds(mixed, ads);
      }

      setSeenIds(newSeenIds);
      setHasMore(transformed.length >= size);

      setMixedPosts((prev) => (initial ? mixed : [...prev, ...mixed]));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetching.current = false;
    }
  };

  // -----------------------------
  // LOAD MORE
  // -----------------------------
  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPosts(next, false);
  };

  // -----------------------------
  // LOAD NEW POSTS
  // -----------------------------
  const loadNew = () => {
    if (pendingNewPosts.length === 0) return;

    const newMixed: MixedPost[] = pendingNewPosts.map((p) => ({
      type: "regular",
      data: p,
    }));

    setMixedPosts((prev) => [...newMixed, ...prev]);
    setPending([]);
    setNewAvailable(false);

    const ids = pendingNewPosts.map((p) => p.id);
    setSeenIds((prev) => new Set([...prev, ...ids]));
  };

  // -----------------------------
  // SWITCH MODE
  // -----------------------------
  const switchMode = (mode: "global" | "university") => {
    setViewMode(mode);
    setPage(0);
    setMixedPosts([]);
    fetchPosts(0, true);
  };

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    fetchPosts(0, true);
  }, []);

  // -----------------------------
  // REALTIME FROM posts TABLE
  // -----------------------------
  useEffect(() => {
    const channel = supabase.channel("home-feed");

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const post = payload.new;
        const transformed = transformPost(post);

        if (!seenIds.has(transformed.id)) {
          setPending((prev) => [transformed, ...prev]);
          setNewAvailable(true);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, (payload) => {
        setMixedPosts((prev) =>
          prev.map((item) => {
            if (item.type === "regular" && (item.data as TransformedPost).id === payload.new.id) {
              const p = item.data as TransformedPost;
              return {
                ...item,
                data: {
                  ...p,
                  likes_count: payload.new.likes_count ?? p.likes_count,
                  comments_count: payload.new.comments_count ?? p.comments_count,
                  views_count: payload.new.views_count ?? p.views_count,
                  content: payload.new.content ?? p.content,
                },
              };
            }
            return item;
          }),
        );
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (payload) => {
        setMixedPosts((prev) =>
          prev.filter((x) => x.type !== "regular" || (x.data as TransformedPost).id !== payload.old.id),
        );
      })
      .subscribe();

    // TS2345 FIX: Return a function that calls supabase.removeChannel(channel)
    return () => {
      supabase.removeChannel(channel);
    };
  }, [seenIds]);

  // -----------------------------
  // INFINITE SCROLL
  // -----------------------------
  useEffect(() => {
    let busy = false;

    const onScroll = () => {
      if (busy) return;

      const top = window.scrollY;
      const height = document.documentElement.scrollHeight;
      const screen = window.innerHeight;

      if (top + screen >= height - 700) {
        busy = true;
        loadMore();

        setTimeout(() => (busy = false), 800);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore, loadingMore, page]);

  return {
    mixedPosts,
    loading,
    loadingMore,
    hasMore,
    viewMode,
    newAvailable,
    pendingNewPosts,
    switchMode,
    loadNew,
    loadMore,
    refetch: () => fetchPosts(0, true),
  };
}
