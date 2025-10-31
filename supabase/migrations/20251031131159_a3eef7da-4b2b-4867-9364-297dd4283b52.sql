-- Allow club owners to update member roles in their clubs
CREATE POLICY "Club owners can update member roles"
ON public.club_memberships
FOR UPDATE
TO authenticated
USING (
  club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);

-- Create club_events table for upcoming events
CREATE TABLE IF NOT EXISTS public.club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  location text,
  image_url text,
  max_attendees integer,
  current_attendees integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on club_events
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

-- Club events policies
CREATE POLICY "Club events are viewable by everyone"
ON public.club_events
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Club owners can create events"
ON public.club_events
FOR INSERT
TO authenticated
WITH CHECK (
  club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Club owners can update their events"
ON public.club_events
FOR UPDATE
TO authenticated
USING (
  club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Club owners can delete their events"
ON public.club_events
FOR DELETE
TO authenticated
USING (
  club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);