-- Fix get_or_create_conversation to match current conversations schema (no user1_deleted/user2_deleted)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user1_id uuid, p_user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conversation_id uuid;
  v_user_a uuid;
  v_user_b uuid;
BEGIN
  IF p_user1_id IS NULL OR p_user2_id IS NULL OR p_user1_id = p_user2_id THEN
    RAISE EXCEPTION 'Invalid users for conversation';
  END IF;

  -- Canonicalize pair to reduce duplicates going forward
  v_user_a := LEAST(p_user1_id, p_user2_id);
  v_user_b := GREATEST(p_user1_id, p_user2_id);

  -- Find any existing conversation for this pair (in either stored order)
  SELECT c.id INTO v_conversation_id
  FROM public.conversations c
  WHERE (c.user1_id = p_user1_id AND c.user2_id = p_user2_id)
     OR (c.user1_id = p_user2_id AND c.user2_id = p_user1_id)
     OR (c.user1_id = v_user_a AND c.user2_id = v_user_b)
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (user1_id, user2_id, updated_at)
    VALUES (v_user_a, v_user_b, now())
    RETURNING id INTO v_conversation_id;
  ELSE
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

  -- Ensure participant rows exist (used by other parts of the app)
  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
  SELECT v_conversation_id, v_user_a, now()
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = v_conversation_id
      AND cp.user_id = v_user_a
  );

  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
  SELECT v_conversation_id, v_user_b, now()
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = v_conversation_id
      AND cp.user_id = v_user_b
  );

  -- If either user had previously deleted the chat, resurrect it
  DELETE FROM public.deleted_chats
  WHERE conversation_id = v_conversation_id
    AND user_id IN (v_user_a, v_user_b);

  RETURN v_conversation_id;
END;
$function$;
