/**
 * Client-Side Caching Layer for Supabase Egress Reduction
 * 
 * This module provides in-memory caching with TTL to reduce
 * redundant database queries and minimize Postgres egress.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxEntries = 500;

  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data with TTL (in milliseconds)
   */
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxEntries: number } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
    };
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  PROFILE: 5 * 60 * 1000,        // 5 minutes - profiles change infrequently
  POSTS_LIST: 30 * 1000,         // 30 seconds - feed updates
  POST_DETAIL: 60 * 1000,        // 1 minute - single post
  LIKES_STATUS: 10 * 1000,       // 10 seconds - like status
  COMMENTS: 30 * 1000,           // 30 seconds - comments
  NOTIFICATIONS: 15 * 1000,      // 15 seconds - notifications
  CONVERSATIONS: 20 * 1000,      // 20 seconds - chat list
  MESSAGES: 5 * 1000,            // 5 seconds - messages (realtime handles most)
  STARTUPS: 5 * 60 * 1000,       // 5 minutes - startup data
  CLUBS: 5 * 60 * 1000,          // 5 minutes - club data
  ADS: 2 * 60 * 1000,            // 2 minutes - advertising posts
} as const;

// Cache key generators
export const cacheKeys = {
  profile: (userId: string) => `profile:${userId}`,
  profileByUsername: (username: string) => `profile:username:${username}`,
  posts: (mode: string, page: number) => `posts:${mode}:${page}`,
  post: (postId: string) => `post:${postId}`,
  likeStatus: (postId: string, userId: string) => `like:${postId}:${userId}`,
  comments: (postId: string) => `comments:${postId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  conversations: (userId: string) => `conversations:${userId}`,
  messages: (conversationId: string) => `messages:${conversationId}`,
  startup: (startupId: string) => `startup:${startupId}`,
  club: (clubId: string) => `club:${clubId}`,
  ads: (university?: string) => `ads:${university || 'global'}`,
};

/**
 * Wrapper for cached Supabase queries
 */
export async function cachedQuery<T>(
  key: string,
  ttl: number,
  queryFn: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query and cache result
  const result = await queryFn();
  memoryCache.set(key, result, ttl);
  return result;
}

/**
 * Batch profile fetcher with caching
 * Reduces N+1 queries by fetching multiple profiles at once
 */
export async function batchFetchProfiles(
  userIds: string[],
  supabase: any
): Promise<Map<string, any>> {
  const profilesMap = new Map<string, any>();
  const uncachedIds: string[] = [];

  // Check cache for each user
  for (const userId of userIds) {
    const cached = memoryCache.get(cacheKeys.profile(userId));
    if (cached) {
      profilesMap.set(userId, cached);
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached profiles in a single query
  if (uncachedIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url, university')
      .in('user_id', uncachedIds);

    if (data) {
      for (const profile of data) {
        memoryCache.set(cacheKeys.profile(profile.user_id), profile, CACHE_TTL.PROFILE);
        profilesMap.set(profile.user_id, profile);
      }
    }
  }

  return profilesMap;
}
