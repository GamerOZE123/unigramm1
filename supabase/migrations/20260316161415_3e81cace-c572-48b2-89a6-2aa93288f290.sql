
-- Allow authenticated users to read early_access_signups
CREATE POLICY "Authenticated users can read signups"
ON public.early_access_signups
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update signups (for invite toggle)
CREATE POLICY "Authenticated users can update signups"
ON public.early_access_signups
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
