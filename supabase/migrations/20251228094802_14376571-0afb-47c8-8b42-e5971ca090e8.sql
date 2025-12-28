-- ================================================
-- CRITICAL INDEXES FOR HIGH-EGRESS TABLES
-- ================================================

-- 1. Messages table: Add composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages (conversation_id, created_at DESC);

-- 2. Messages: Add sender_id index for user message lookups
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
ON public.messages (sender_id);

-- 3. Conversation participants: Critical missing index
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id 
ON public.conversation_participants (user_id);

-- 4. Notifications: Add user_id index with is_read for unread queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, is_read, created_at DESC);

-- 5. Likes: Add composite index for post/user lookups
CREATE INDEX IF NOT EXISTS idx_likes_post_user 
ON public.likes (post_id, user_id);

-- 6. Posts: Add visibility filter index for ranked_posts view
CREATE INDEX IF NOT EXISTS idx_posts_visibility 
ON public.posts (visibility, created_at DESC);

-- 7. Post views: Add composite index for deduplication
CREATE INDEX IF NOT EXISTS idx_post_views_post_session 
ON public.post_views (post_id, session_id);

-- 8. Comments: Add post_id index for comment fetching
CREATE INDEX IF NOT EXISTS idx_comments_post_id 
ON public.comments (post_id, created_at ASC);

-- 9. Advertising posts: Add targeting index
CREATE INDEX IF NOT EXISTS idx_advertising_posts_active 
ON public.advertising_posts (is_active, priority_placement DESC);

-- 10. Recent chats: Add user lookup index (using last_interacted_at)
CREATE INDEX IF NOT EXISTS idx_recent_chats_user_id 
ON public.recent_chats (user_id, last_interacted_at DESC)