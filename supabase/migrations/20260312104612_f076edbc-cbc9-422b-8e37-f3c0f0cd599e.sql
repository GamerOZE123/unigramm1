-- Early access signups
CREATE TABLE public.early_access_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  university text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign up for early access"
  ON public.early_access_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Contributor/help applications
CREATE TABLE public.contributor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  skills text,
  message text,
  portfolio_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contributor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contributor application"
  ON public.contributor_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);