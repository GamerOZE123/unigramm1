-- Hash existing plaintext admin_team_members passwords with bcrypt
UPDATE public.admin_team_members
SET password = extensions.crypt(password, extensions.gen_salt('bf', 10))
WHERE password IS NOT NULL
  AND password !~ '^\$2[aby]\$';

CREATE OR REPLACE FUNCTION public.verify_admin_team_password(_password text)
RETURNS TABLE(id uuid, name text, email text, allowed_sections text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT m.id, m.name, m.email, m.allowed_sections
  FROM public.admin_team_members m
  WHERE m.is_active = true
    AND m.password = extensions.crypt(_password, m.password)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_admin_team_password(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_team_password(text) TO service_role;

CREATE OR REPLACE FUNCTION public.hash_admin_team_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.password IS NOT NULL AND NEW.password !~ '^\$2[aby]\$' THEN
    NEW.password := extensions.crypt(NEW.password, extensions.gen_salt('bf', 10));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hash_admin_team_password_trigger ON public.admin_team_members;
CREATE TRIGGER hash_admin_team_password_trigger
BEFORE INSERT OR UPDATE OF password ON public.admin_team_members
FOR EACH ROW
EXECUTE FUNCTION public.hash_admin_team_password();