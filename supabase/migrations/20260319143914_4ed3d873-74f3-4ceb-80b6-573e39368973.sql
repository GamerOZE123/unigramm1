-- Allow anon to read university_features
CREATE POLICY "Anyone can read university_features (anon)"
  ON public.university_features FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to update university_features
CREATE POLICY "Authenticated users can update university_features"
  ON public.university_features FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon to update university_features
CREATE POLICY "Anon can update university_features"
  ON public.university_features FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);