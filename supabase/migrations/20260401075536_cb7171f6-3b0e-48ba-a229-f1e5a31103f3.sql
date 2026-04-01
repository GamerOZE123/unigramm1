
-- Allow anon and authenticated to insert, update, delete university_courses
-- (Admin panel uses anon role since admin auth is password-based, not Supabase Auth)

CREATE POLICY "Anyone can insert university courses"
ON public.university_courses FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update university courses"
ON public.university_courses FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete university courses"
ON public.university_courses FOR DELETE
TO anon, authenticated
USING (true);
