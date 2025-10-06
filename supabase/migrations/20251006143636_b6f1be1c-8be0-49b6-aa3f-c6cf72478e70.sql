-- Function to update recent_chats when a message is sent
CREATE OR REPLACE FUNCTION update_recent_chats_on_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
  receiver_id uuid;
BEGIN
  -- Get the other user in the conversation
  SELECT 
    CASE 
      WHEN c.user1_id = NEW.sender_id THEN c.user2_id
      ELSE c.user1_id
    END INTO receiver_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;

  -- Get sender's profile info
  SELECT full_name, username, university, avatar_url
  INTO sender_profile
  FROM profiles
  WHERE user_id = NEW.sender_id;

  -- Update recent_chats for SENDER
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

  -- Update recent_chats for RECEIVER
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS update_recent_chats_trigger ON messages;
CREATE TRIGGER update_recent_chats_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_recent_chats_on_message();