-- Add push token support to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token_updated_at timestamptz;

-- Create message notifications queue table
CREATE TABLE IF NOT EXISTS message_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  delivered boolean DEFAULT false,
  delivery_attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_message_notifications_pending 
  ON message_notifications(delivered, created_at) 
  WHERE delivered = false;
CREATE INDEX IF NOT EXISTS idx_message_notifications_receiver 
  ON message_notifications(receiver_id);

-- Create notification batches table for anti-spam
CREATE TABLE IF NOT EXISTS notification_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message_count integer DEFAULT 1,
  first_message_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  batch_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_batches_pending 
  ON notification_batches(receiver_id, sender_id) 
  WHERE batch_sent = false;

-- RLS for message_notifications
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" 
  ON message_notifications FOR SELECT 
  USING (auth.uid() = receiver_id);

CREATE POLICY "Service role full access to message_notifications"
  ON message_notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS for notification_batches  
ALTER TABLE notification_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to notification_batches"
  ON notification_batches FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger function to queue notifications
CREATE OR REPLACE FUNCTION enqueue_message_notification()
RETURNS trigger AS $$
DECLARE
  v_receiver_id uuid;
  v_receiver_online boolean;
BEGIN
  -- Determine receiver (the other person in the conversation)
  SELECT 
    CASE 
      WHEN c.user1_id = NEW.sender_id THEN c.user2_id 
      ELSE c.user1_id 
    END INTO v_receiver_id
  FROM conversations c 
  WHERE c.id = NEW.conversation_id;

  -- Skip if no receiver found
  IF v_receiver_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if receiver is online
  SELECT up.is_online INTO v_receiver_online
  FROM user_presence up 
  WHERE up.user_id = v_receiver_id;

  -- Only queue notification if receiver is offline
  IF v_receiver_online IS NULL OR v_receiver_online = false THEN
    INSERT INTO message_notifications (
      message_id, 
      sender_id, 
      receiver_id, 
      conversation_id
    )
    VALUES (
      NEW.id, 
      NEW.sender_id, 
      v_receiver_id, 
      NEW.conversation_id
    );
    
    -- Update or create batch for anti-spam
    INSERT INTO notification_batches (receiver_id, sender_id, message_count, first_message_at, last_message_at)
    VALUES (v_receiver_id, NEW.sender_id, 1, now(), now())
    ON CONFLICT (receiver_id, sender_id) WHERE batch_sent = false
    DO UPDATE SET 
      message_count = notification_batches.message_count + 1,
      last_message_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS on_new_message_notify ON messages;
CREATE TRIGGER on_new_message_notify
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION enqueue_message_notification();