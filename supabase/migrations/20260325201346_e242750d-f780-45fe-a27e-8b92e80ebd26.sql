-- Allow authenticated users (admins via edge function) to update app_settings
CREATE POLICY "Allow update app_settings for authenticated"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow upsert (insert) into app_settings for authenticated users
CREATE POLICY "Allow insert app_settings for authenticated"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow anon role (admin panel uses anon key with password auth)
CREATE POLICY "Allow update app_settings for anon"
ON public.app_settings
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow insert app_settings for anon"
ON public.app_settings
FOR INSERT
TO anon
WITH CHECK (true);