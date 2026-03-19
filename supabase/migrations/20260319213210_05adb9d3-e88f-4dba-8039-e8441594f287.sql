CREATE TABLE public.android_testers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.android_testers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.android_testers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow reads" ON public.android_testers
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow updates" ON public.android_testers
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);