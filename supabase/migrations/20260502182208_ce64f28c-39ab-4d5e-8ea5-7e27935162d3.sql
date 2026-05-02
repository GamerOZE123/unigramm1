CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(user_count bigint, startup_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.profiles),
    (SELECT count(*) FROM public.student_startups);
$$;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;