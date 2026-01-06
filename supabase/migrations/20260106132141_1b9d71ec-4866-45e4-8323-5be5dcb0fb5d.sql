
-- Drop and recreate the notify_post_like function with correct parameters
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  liker_username TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user liked their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the liker's username
  SELECT username INTO liker_username FROM profiles WHERE user_id = NEW.user_id;
  
  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message, related_user_id, related_post_id)
  VALUES (
    post_owner_id,
    'like',
    'New Like',
    COALESCE(liker_username, 'Someone') || ' liked your post',
    NEW.user_id,
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_notify_like ON likes;
CREATE TRIGGER trigger_notify_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();

-- Drop and recreate the notify_post_comment function
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user commented on their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get the commenter's username
  SELECT username INTO commenter_username FROM profiles WHERE user_id = NEW.user_id;
  
  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message, related_user_id, related_post_id, related_comment_id)
  VALUES (
    post_owner_id,
    'comment',
    'New Comment',
    COALESCE(commenter_username, 'Someone') || ' commented on your post',
    NEW.user_id,
    NEW.post_id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_notify_comment ON comments;
CREATE TRIGGER trigger_notify_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();
