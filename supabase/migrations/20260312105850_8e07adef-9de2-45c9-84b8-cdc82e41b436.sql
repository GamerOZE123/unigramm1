CREATE POLICY "Anyone can update their own contributor application by email"
  ON public.contributor_applications
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);