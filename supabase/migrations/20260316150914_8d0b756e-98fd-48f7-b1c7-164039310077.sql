-- 1. Add invited column to early_access_signups
ALTER TABLE public.early_access_signups
ADD COLUMN IF NOT EXISTS invited boolean NOT NULL DEFAULT false;

-- 2. Add approved column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- 3. Update handle_new_user to check early_access_signups.invited
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  final_username TEXT;
  username_suffix TEXT;
  counter INT := 0;
  is_approved BOOLEAN := false;
BEGIN
  -- Check if email exists in early_access_signups with invited = true
  SELECT EXISTS (
    SELECT 1 FROM public.early_access_signups
    WHERE email = lower(trim(NEW.email))
    AND invited = true
  ) INTO is_approved;

  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  base_username := left(base_username, 20);
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    username_suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    final_username := base_username || '_' || username_suffix;
    counter := counter + 1;
    IF counter > 10 THEN
      final_username := base_username || '_' || substr(md5(NEW.id::text), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (
    user_id, username, full_name, email, user_type, university, approved
  ) VALUES (
    NEW.id, final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_type,
    NEW.raw_user_meta_data->>'university',
    is_approved
  );
  RETURN NEW;
END;
$function$;