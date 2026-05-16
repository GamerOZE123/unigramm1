
ALTER TABLE public.campus_locations DROP CONSTRAINT IF EXISTS campus_locations_user_id_key;
DROP INDEX IF EXISTS public.campus_locations_user_id_key;

ALTER TABLE public.device_tokens DROP CONSTRAINT IF EXISTS device_tokens_user_platform_uc;
DROP INDEX IF EXISTS public.device_tokens_user_platform_uc;
