-- Fix SECURITY DEFINER functions missing SET search_path
-- This prevents search_path injection attacks

-- 1. Fix get_challenge_participant_count
CREATE OR REPLACE FUNCTION public.get_challenge_participant_count(challenge_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(*)::integer
  FROM public.challenge_participants
  WHERE challenge_id = challenge_uuid;
$function$;

-- 2. Fix get_or_create_conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  conversation_uuid uuid;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO conversation_uuid
  FROM conversations c
  WHERE (c.user1_id = $1 AND c.user2_id = $2) 
     OR (c.user1_id = $2 AND c.user2_id = $1);
  
  -- If conversation doesn't exist, create it
  IF conversation_uuid IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id, created_at, updated_at)
    VALUES ($1, $2, now(), now())
    RETURNING id INTO conversation_uuid;
    
    -- Add participants to conversation_participants table
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_uuid, $1),
      (conversation_uuid, $2);
  END IF;
  
  RETURN conversation_uuid;
END;
$function$;

-- 3. Fix get_unswiped_jobs_for_student
CREATE OR REPLACE FUNCTION public.get_unswiped_jobs_for_student(student_user_id uuid)
RETURNS TABLE(job_id uuid, title text, description text, company_name text, location text, salary_range text, job_type text, skills_required text[], company_logo text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    j.id as job_id,
    j.title,
    j.description,
    cp.company_name,
    j.location,
    j.salary_range,
    j.job_type,
    j.skills_required,
    cp.logo_url as company_logo
  FROM public.jobs j
  JOIN public.company_profiles cp ON j.company_id = cp.user_id
  WHERE j.is_active = true
    AND j.id NOT IN (
      SELECT job_id FROM public.job_swipes WHERE student_id = student_user_id
    )
    AND j.application_deadline > CURRENT_DATE
  ORDER BY j.created_at DESC;
END;
$function$;

-- 4. Fix is_group_member
CREATE OR REPLACE FUNCTION public.is_group_member(p_user_id uuid, p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.chat_group_members 
    WHERE user_id = p_user_id 
      AND group_id = p_group_id
  );
$function$;

-- 5. Fix user_in_conversation
CREATE OR REPLACE FUNCTION public.user_in_conversation(conv_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = conv_id AND user_id = check_user_id
  );
$function$;