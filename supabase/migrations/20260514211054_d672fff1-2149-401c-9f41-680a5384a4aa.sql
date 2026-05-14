
CREATE TABLE IF NOT EXISTS public.user_location_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  location_name TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ulh_user_recorded ON public.user_location_history(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ulh_recorded ON public.user_location_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ulh_location_name ON public.user_location_history(location_name);

ALTER TABLE public.user_location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own location"
ON public.user_location_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own location"
ON public.user_location_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all location history"
ON public.user_location_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
