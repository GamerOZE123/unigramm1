ALTER TABLE public.app_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view app announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can create app announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can update app announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Authenticated users can delete app announcements" ON public.app_announcements;
DROP POLICY IF EXISTS "Allow authenticated users to create announcements" ON public.app_announcements;

CREATE POLICY "Authenticated users can view app announcements"
ON public.app_announcements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create app announcements"
ON public.app_announcements
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update app announcements"
ON public.app_announcements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete app announcements"
ON public.app_announcements
FOR DELETE
TO authenticated
USING (true);