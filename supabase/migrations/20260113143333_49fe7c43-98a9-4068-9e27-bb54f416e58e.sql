-- Fix handle_new_user function to generate unique usernames
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
BEGIN
  -- Get base username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    split_part(NEW.email, '@', 1)
  );
  
  -- Clean the base username (remove special characters, limit length)
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  base_username := left(base_username, 20);
  
  -- If base_username is empty, use 'user'
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;
  
  -- Try to use base username first, then add random suffix if exists
  final_username := base_username;
  
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    -- Generate a random suffix (6 characters)
    username_suffix := substr(md5(random()::text || clock_timestamp()::text), 1, 6);
    final_username := base_username || '_' || username_suffix;
    counter := counter + 1;
    
    -- Safety exit after 10 attempts
    IF counter > 10 THEN
      final_username := base_username || '_' || substr(md5(NEW.id::text), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (
    user_id, 
    username, 
    full_name, 
    email,
    user_type,
    university
  )
  VALUES (
    NEW.id, 
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_type,
    NEW.raw_user_meta_data->>'university'
  );
  RETURN NEW;
END;
$function$;