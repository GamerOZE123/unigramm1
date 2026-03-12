CREATE POLICY "Anyone can read their own contributor application"
  ON public.contributor_applications
  FOR SELECT
  TO anon, authenticated
  USING (true);