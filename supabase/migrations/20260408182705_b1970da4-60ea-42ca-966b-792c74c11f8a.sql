
CREATE POLICY "Allow authenticated users to insert announcements"
ON public.app_announcements
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update announcements"
ON public.app_announcements
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete announcements"
ON public.app_announcements
FOR DELETE TO authenticated
USING (true);
