-- Fix search path for update_club_member_count function
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clubs_profiles 
    SET member_count = member_count + 1 
    WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clubs_profiles 
    SET member_count = GREATEST(0, member_count - 1) 
    WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$;