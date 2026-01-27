-- =============================================================
-- Add automatic unread count reset trigger on message read
-- =============================================================

-- Trigger function: Reset unread count when all messages are read
CREATE OR REPLACE FUNCTION public.reset_unread_on_read()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_user_id uuid;
  v_unread_remaining int;
BEGIN
  -- Only act when status changes to 'read'
  IF NEW.status = 'read' AND (OLD.status IS NULL OR OLD.status != 'read') THEN
    v_user_id := NEW.user_id;
    
    -- Get the conversation_id for this message
    SELECT conversation_id INTO v_conversation_id
    FROM messages
    WHERE id = NEW.message_id;
    
    IF v_conversation_id IS NOT NULL THEN
      -- Count remaining unread messages for this user in this conversation
      SELECT COUNT(*)::int INTO v_unread_remaining
      FROM messages m
      JOIN message_status ms ON ms.message_id = m.id
      WHERE m.conversation_id = v_conversation_id
        AND m.sender_id != v_user_id
        AND ms.user_id = v_user_id
        AND ms.status != 'read';
      
      -- Update the appropriate unread counter
      UPDATE conversations
      SET 
        unread_count_user1 = CASE 
          WHEN user1_id = v_user_id THEN v_unread_remaining
          ELSE unread_count_user1 
        END,
        unread_count_user2 = CASE 
          WHEN user2_id = v_user_id THEN v_unread_remaining
          ELSE unread_count_user2 
        END
      WHERE id = v_conversation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS reset_unread_on_read_trigger ON message_status;
CREATE TRIGGER reset_unread_on_read_trigger
  AFTER UPDATE ON message_status
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_on_read();