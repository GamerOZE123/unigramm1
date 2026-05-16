-- FIX 1: drop unused reply column (verified 0 rows)
ALTER TABLE public.messages DROP COLUMN IF EXISTS reply_to_message_id;

-- FIX 2: add media_url to group_messages
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS media_url TEXT[];

-- FIX 3: remove duplicate INSERT policies on conversations
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

-- FIX 4: dedupe + unique index on campus_locations(user_id)
DELETE FROM public.campus_locations a
USING public.campus_locations b
WHERE a.id > b.id AND a.user_id = b.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS campus_locations_user_id_unique
  ON public.campus_locations(user_id);

-- FIX 5: dedupe + composite unique index on device_tokens(user_id, platform)
DELETE FROM public.device_tokens a
USING public.device_tokens b
WHERE a.id > b.id AND a.user_id = b.user_id AND a.platform = b.platform;

DROP INDEX IF EXISTS public.device_tokens_user_id_key;
DROP INDEX IF EXISTS public.device_tokens_user_id_unique;

CREATE UNIQUE INDEX IF NOT EXISTS device_tokens_user_id_platform_unique
  ON public.device_tokens(user_id, platform);