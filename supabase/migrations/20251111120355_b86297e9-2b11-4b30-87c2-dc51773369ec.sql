-- Fix security issues: Add SET search_path to functions and restrict anonymous access

-- 1. Fix workouts table policies - restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;

CREATE POLICY "Authenticated users can view their own workouts" 
ON public.workouts 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own workouts" 
ON public.workouts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own workouts" 
ON public.workouts 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own workouts" 
ON public.workouts 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix conversations table policies - ensure metadata is only visible to participants
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- 3. Add SET search_path to functions that are missing it
CREATE OR REPLACE FUNCTION public.update_conversation_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.conversations 
  SET 
    last_activity = NEW.created_at,
    last_message_id = NEW.id,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_auction_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    UPDATE public.auctions 
    SET current_price = NEW.amount 
    WHERE id = NEW.auction_id;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_chat_groups_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE public.challenge_participants 
  SET current_progress = (
    SELECT COALESCE(SUM(progress_value), 0)
    FROM public.challenge_progress 
    WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id
  )
  WHERE challenge_id = NEW.challenge_id AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.extract_hashtags(content text)
RETURNS text[]
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    hashtags text[];
BEGIN
    SELECT array_agg(DISTINCT lower(substring(match FROM 2)))
    INTO hashtags
    FROM regexp_split_to_table(content, '\s+') AS match
    WHERE match ~ '^#[a-zA-Z0-9_]+$';
    
    RETURN COALESCE(hashtags, '{}');
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_hashtags_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.hashtags = extract_hashtags(NEW.content);
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_advertising_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.advertising_posts SET likes_count = likes_count + 1 WHERE id = NEW.advertising_post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.advertising_posts SET likes_count = likes_count - 1 WHERE id = OLD.advertising_post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_advertising_post_click_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.advertising_posts SET click_count = click_count + 1 WHERE id = NEW.advertising_post_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_message_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  participant_id uuid;
BEGIN
  FOR participant_id IN 
    SELECT cp.user_id 
    FROM public.conversation_participants cp 
    WHERE cp.conversation_id = NEW.conversation_id 
    AND cp.user_id != NEW.sender_id
  LOOP
    INSERT INTO public.message_status (message_id, user_id, status)
    VALUES (NEW.id, participant_id, 'delivered')
    ON CONFLICT (message_id, user_id) DO NOTHING;
  END LOOP;
  
  INSERT INTO public.message_status (message_id, user_id, status)
  VALUES (NEW.id, NEW.sender_id, 'sent')
  ON CONFLICT (message_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conversation_uuid uuid, reader_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.message_status 
  SET status = 'read', timestamp = now()
  WHERE message_id IN (
    SELECT m.id FROM public.messages m
    WHERE m.conversation_id = conversation_uuid
    AND m.sender_id != reader_user_id
  )
  AND user_id = reader_user_id
  AND status != 'read';
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_typing_status(conversation_uuid uuid, typing_user_id uuid, typing_state boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.typing_status (conversation_id, user_id, is_typing, last_activity)
  VALUES (conversation_uuid, typing_user_id, typing_state, now())
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET 
    is_typing = typing_state,
    last_activity = now(),
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_presence(target_user_id uuid, online_status boolean, presence_status text DEFAULT 'online'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_presence (user_id, is_online, status, last_seen)
  VALUES (target_user_id, online_status, presence_status, now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    is_online = online_status,
    status = presence_status,
    last_seen = CASE WHEN online_status THEN user_presence.last_seen ELSE now() END,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_recent_chat(current_user_id uuid, target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  target_user RECORD;
BEGIN
  SELECT full_name, username, university, avatar_url
  INTO target_user
  FROM profiles
  WHERE user_id = target_user_id;

  INSERT INTO recent_chats (
    user_id,
    other_user_id,
    other_user_name,
    other_user_university,
    other_user_avatar,
    last_interacted_at,
    deleted_at
  )
  VALUES (
    current_user_id,
    target_user_id,
    COALESCE(target_user.full_name, target_user.username, 'Unknown'),
    COALESCE(target_user.university, ''),
    COALESCE(target_user.avatar_url, ''),
    NOW(),
    NULL
  )
  ON CONFLICT (user_id, other_user_id)
  DO UPDATE SET
    other_user_name = EXCLUDED.other_user_name,
    other_user_university = EXCLUDED.other_user_university,
    other_user_avatar = EXCLUDED.other_user_avatar,
    last_interacted_at = NOW(),
    deleted_at = NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_monthly_post_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.company_profiles 
  SET monthly_posts_used = 0
  WHERE subscription_expires_at <= now();
  
  UPDATE public.company_profiles 
  SET subscription_expires_at = subscription_expires_at + interval '30 days'
  WHERE subscription_expires_at <= now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_recent_chats_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  sender_profile RECORD;
  receiver_id uuid;
BEGIN
  SELECT 
    CASE 
      WHEN c.user1_id = NEW.sender_id THEN c.user2_id
      ELSE c.user1_id
    END INTO receiver_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  SELECT full_name, username, university, avatar_url
  INTO sender_profile
  FROM profiles
  WHERE user_id = NEW.sender_id;

  INSERT INTO recent_chats (
    user_id,
    other_user_id,
    other_user_name,
    other_user_university,
    other_user_avatar,
    last_interacted_at,
    deleted_at
  )
  SELECT
    NEW.sender_id,
    receiver_id,
    COALESCE(p.full_name, p.username, 'Unknown'),
    COALESCE(p.university, ''),
    COALESCE(p.avatar_url, ''),
    NEW.created_at,
    NULL
  FROM profiles p
  WHERE p.user_id = receiver_id
  ON CONFLICT (user_id, other_user_id)
  DO UPDATE SET
    last_interacted_at = NEW.created_at,
    deleted_at = NULL;

  INSERT INTO recent_chats (
    user_id,
    other_user_id,
    other_user_name,
    other_user_university,
    other_user_avatar,
    last_interacted_at,
    deleted_at
  )
  VALUES (
    receiver_id,
    NEW.sender_id,
    COALESCE(sender_profile.full_name, sender_profile.username, 'Unknown'),
    COALESCE(sender_profile.university, ''),
    COALESCE(sender_profile.avatar_url, ''),
    NEW.created_at,
    NULL
  )
  ON CONFLICT (user_id, other_user_id)
  DO UPDATE SET
    last_interacted_at = NEW.created_at,
    deleted_at = NULL;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  participant_record RECORD;
  sender_name TEXT;
BEGIN
  SELECT pr.full_name INTO sender_name 
  FROM public.profiles pr 
  WHERE pr.user_id = NEW.sender_id;

  FOR participant_record IN 
    SELECT cp.user_id 
    FROM public.conversation_participants cp 
    WHERE cp.conversation_id = NEW.conversation_id 
    AND cp.user_id != NEW.sender_id
  LOOP
    PERFORM create_notification(
      participant_record.user_id,
      'message',
      'New message',
      sender_name || ' sent you a message',
      NEW.sender_id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
BEGIN
  SELECT p.user_id INTO post_author_id 
  FROM public.posts p 
  WHERE p.id = NEW.post_id;
  
  SELECT pr.full_name INTO commenter_name 
  FROM public.profiles pr 
  WHERE pr.user_id = NEW.user_id;

  PERFORM create_notification(
    post_author_id,
    'comment',
    'New comment on your post',
    commenter_name || ' commented on your post',
    NEW.user_id,
    NEW.post_id,
    NEW.id
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_notification(target_user_id uuid, notification_type text, notification_title text, notification_message text, sender_user_id uuid DEFAULT NULL::uuid, post_id uuid DEFAULT NULL::uuid, comment_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  IF target_user_id = sender_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_user_id,
    related_post_id,
    related_comment_id
  ) VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    sender_user_id,
    post_id,
    comment_id
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_author_id UUID;
  liker_name TEXT;
BEGIN
  SELECT p.user_id INTO post_author_id 
  FROM public.posts p 
  WHERE p.id = NEW.post_id;
  
  SELECT pr.full_name INTO liker_name 
  FROM public.profiles pr 
  WHERE pr.user_id = NEW.user_id;

  PERFORM create_notification(
    post_author_id,
    'like',
    'New like on your post',
    liker_name || ' liked your post',
    NEW.user_id,
    NEW.post_id
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE user_id = NEW.follower_id;
    
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET following_count = GREATEST(0, following_count - 1) 
    WHERE user_id = OLD.follower_id;
    
    UPDATE public.profiles 
    SET followers_count = GREATEST(0, followers_count - 1) 
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_banner_click_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.homepage_banners 
  SET click_count = click_count + 1 
  WHERE id = NEW.banner_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_banner_views_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.homepage_banners 
  SET views_count = views_count + 1 
  WHERE id = NEW.banner_id;
  RETURN NEW;
END;
$function$;

-- 4. Add authorization check to accept_club_join_request function
CREATE OR REPLACE FUNCTION public.accept_club_join_request(request_id_param uuid, student_id_param uuid, club_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Add authorization check: only club admins can accept requests
  IF NOT EXISTS (
    SELECT 1 FROM club_memberships 
    WHERE club_id = club_id_param 
    AND user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only club admins can accept join requests';
  END IF;

  -- Update the request status to accepted
  UPDATE club_join_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id_param;

  -- Insert into club_memberships if not already exists
  INSERT INTO club_memberships (club_id, user_id, role)
  VALUES (club_id_param, student_id_param, 'member')
  ON CONFLICT (club_id, user_id) DO NOTHING;

  -- Update member count in clubs_profiles
  UPDATE clubs_profiles
  SET member_count = (
    SELECT COUNT(*) FROM club_memberships WHERE club_id = club_id_param
  )
  WHERE id = club_id_param;
END;
$function$;