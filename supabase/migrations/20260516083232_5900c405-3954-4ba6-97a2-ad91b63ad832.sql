
-- Re-add password column on admin_team_members
ALTER TABLE public.admin_team_members
  ADD COLUMN IF NOT EXISTS password text;

REVOKE SELECT (password) ON public.admin_team_members FROM anon, authenticated;

-- Bcrypt hashing trigger
CREATE OR REPLACE FUNCTION public.hash_admin_team_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.password IS NOT NULL AND NEW.password <> '' AND NEW.password NOT LIKE '$2%' THEN
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

-- Verify function (idempotent re-create)
CREATE OR REPLACE FUNCTION public.verify_admin_team_password(_password text)
RETURNS TABLE(id uuid, name text, email text, allowed_sections text[])
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT m.id, m.name, m.email, m.allowed_sections
  FROM public.admin_team_members m
  WHERE m.is_active = true
    AND m.password IS NOT NULL
    AND m.password = extensions.crypt(_password, m.password)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_admin_team_password(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_team_password(text) TO service_role;
