
-- Restrict advertising_clicks INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can create advertising clicks" ON public.advertising_clicks;
CREATE POLICY "Authenticated can create advertising clicks"
ON public.advertising_clicks FOR INSERT TO authenticated
WITH CHECK (true);

-- Make profiles_public view enforce the querying user's RLS
ALTER VIEW public.profiles_public SET (security_invoker = true);
