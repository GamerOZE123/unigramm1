-- 1. Fix notify_message() to insert directly instead of calling create_notification()
CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  participant_record RECORD;
  sender_name TEXT;
BEGIN
  SELECT COALESCE(pr.full_name, pr.username, 'Unigramm User') INTO sender_name
  FROM public.profiles pr
  WHERE pr.user_id = NEW.sender_id;

  FOR participant_record IN
    SELECT cp.user_id
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id != NEW.sender_id
  LOOP
    -- Skip if handle_new_message() already inserted a notification for this message+recipient
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = participant_record.user_id
        AND n.related_user_id = NEW.sender_id
        AND n.conversation_id = NEW.conversation_id
        AND n.type = 'message'
        AND n.created_at > now() - interval '5 seconds'
    ) THEN
      INSERT INTO public.notifications (
        user_id, related_user_id, type, title, message, conversation_id
      ) VALUES (
        participant_record.user_id,
        NEW.sender_id,
        'message',
        sender_name,
        LEFT(COALESCE(NEW.content, 'Sent a message'), 200),
        NEW.conversation_id
      );
    END IF;
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'notify_message error: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2. Expand messages.message_type CHECK constraint
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type = ANY (ARRAY['text','image','video','audio','shared_post','system','file','reply']));