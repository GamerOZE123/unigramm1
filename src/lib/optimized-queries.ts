/**
 * Optimized Supabase Queries
 * 
 * These functions reduce egress by:
 * 1. Selecting only required columns
 * 2. Using proper pagination
 * 3. Leveraging indexes
 * 4. Batch fetching related data
 */

import { supabase } from '@/integrations/supabase/client';
import { memoryCache, CACHE_TTL, cacheKeys, cachedQuery, batchFetchProfiles } from './cache';

/**
 * Fetch posts with minimal egress
 * Uses ranked_posts view which is pre-joined
 */
export async function fetchOptimizedPosts(
  mode: 'global' | 'university',
  university: string | null,
  page: number = 0,
  pageSize: number = 20
) {
  const cacheKey = cacheKeys.posts(mode + (university || ''), page);
  
  return cachedQuery(cacheKey, CACHE_TTL.POSTS_LIST, async () => {
    const start = page * pageSize;
    const end = start + pageSize - 1;

    let query = supabase
      .from('ranked_posts')
      .select(`
        id,
        content,
        image_url,
        image_urls,
        created_at,
        likes_count,
        comments_count,
        views_count,
        user_id,
        username,
        full_name,
        avatar_url,
        university,
        hashtags,
        poll_question,
        poll_options,
        poll_ends_at,
        survey_questions,
        startup_id,
        score
      `);

    if (mode === 'global') {
      query = query.eq('visibility', 'global');
    } else if (mode === 'university' && university) {
      query = query.eq('visibility', 'university').eq('university', university);
    }

    const { data, error } = await query
      .order('score', { ascending: false })
      .range(start, end);

    if (error) throw error;
    return data || [];
  });
}

/**
 * Fetch single post with caching
 */
export async function fetchOptimizedPost(postId: string) {
  const cacheKey = cacheKeys.post(postId);
  
  return cachedQuery(cacheKey, CACHE_TTL.POST_DETAIL, async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        content,
        image_url,
        image_urls,
        hashtags,
        likes_count,
        comments_count,
        views_count,
        created_at,
        poll_question,
        poll_options,
        poll_ends_at,
        survey_questions,
        startup_id
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;

    // Fetch profile separately and cache it
    if (data) {
      const profiles = await batchFetchProfiles([data.user_id], supabase);
      return { ...data, profiles: profiles.get(data.user_id) };
    }
    
    return null;
  });
}

/**
 * Optimized like status check
 * Uses index: idx_likes_post_user
 */
export async function fetchLikeStatus(postId: string, userId: string) {
  const cacheKey = cacheKeys.likeStatus(postId, userId);
  
  return cachedQuery(cacheKey, CACHE_TTL.LIKES_STATUS, async () => {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    return !!data;
  });
}

/**
 * Batch check like status for multiple posts
 */
export async function batchFetchLikeStatus(
  postIds: string[],
  userId: string
): Promise<Set<string>> {
  const likedPosts = new Set<string>();
  const uncachedIds: string[] = [];

  // Check cache
  for (const postId of postIds) {
    const cached = memoryCache.get<boolean>(cacheKeys.likeStatus(postId, userId));
    if (cached !== null) {
      if (cached) likedPosts.add(postId);
    } else {
      uncachedIds.push(postId);
    }
  }

  // Fetch uncached
  if (uncachedIds.length > 0) {
    const { data } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', uncachedIds);

    const likedSet = new Set((data || []).map(l => l.post_id));
    
    for (const postId of uncachedIds) {
      const isLiked = likedSet.has(postId);
      memoryCache.set(cacheKeys.likeStatus(postId, userId), isLiked, CACHE_TTL.LIKES_STATUS);
      if (isLiked) likedPosts.add(postId);
    }
  }

  return likedPosts;
}

/**
 * Optimized comments fetch
 * Uses index: idx_comments_post_id
 */
export async function fetchOptimizedComments(postId: string, limit: number = 50) {
  const cacheKey = cacheKeys.comments(postId);
  
  return cachedQuery(cacheKey, CACHE_TTL.COMMENTS, async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Batch fetch profiles
    const userIds = [...new Set((data || []).map(c => c.user_id))];
    const profiles = await batchFetchProfiles(userIds, supabase);

    return (data || []).map(comment => ({
      ...comment,
      profiles: profiles.get(comment.user_id) || null
    }));
  });
}

/**
 * Optimized notifications fetch
 * Uses index: idx_notifications_user_unread
 */
export async function fetchOptimizedNotifications(userId: string, limit: number = 50) {
  const cacheKey = cacheKeys.notifications(userId);
  
  return cachedQuery(cacheKey, CACHE_TTL.NOTIFICATIONS, async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        is_read,
        created_at,
        related_user_id,
        related_post_id
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  });
}

/**
 * Optimized messages fetch with pagination
 * Uses index: idx_messages_conversation_created
 */
export async function fetchOptimizedMessages(
  conversationId: string,
  clearedAt: string | null,
  limit: number = 30,
  offset: number = 0
) {
  let query = supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      sender_id,
      media_url,
      media_type,
      reply_to_message_id
    `)
    .eq('conversation_id', conversationId);

  if (clearedAt) {
    query = query.gt('created_at', clearedAt);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data || []).reverse();
}

/**
 * Invalidate caches on mutations
 */
export const invalidateCache = {
  post: (postId: string) => {
    memoryCache.invalidate(cacheKeys.post(postId));
    memoryCache.invalidatePattern('^posts:');
  },
  
  like: (postId: string, userId: string) => {
    memoryCache.invalidate(cacheKeys.likeStatus(postId, userId));
    memoryCache.invalidate(cacheKeys.post(postId));
  },
  
  comment: (postId: string) => {
    memoryCache.invalidate(cacheKeys.comments(postId));
    memoryCache.invalidate(cacheKeys.post(postId));
  },
  
  notifications: (userId: string) => {
    memoryCache.invalidate(cacheKeys.notifications(userId));
  },
  
  conversations: (userId: string) => {
    memoryCache.invalidate(cacheKeys.conversations(userId));
  },
  
  profile: (userId: string) => {
    memoryCache.invalidate(cacheKeys.profile(userId));
  },
  
  all: () => {
    memoryCache.clear();
  }
};
