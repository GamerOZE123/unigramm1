-- Create club_join_requests table
CREATE TABLE IF NOT EXISTS public.club_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(club_id, student_id)
);

-- Enable RLS
ALTER TABLE public.club_join_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests
CREATE POLICY "Students can view their own requests"
ON public.club_join_requests
FOR SELECT
USING (auth.uid() = student_id);

-- Club owners can view requests for their clubs
CREATE POLICY "Club owners can view requests for their clubs"
ON public.club_join_requests
FOR SELECT
USING (
  club_id IN (
    SELECT id FROM public.clubs_profiles WHERE user_id = auth.uid()
  )
);

-- Club owners can create join requests (inviting students)
CREATE POLICY "Club owners can create join requests"
ON public.club_join_requests
FOR INSERT
WITH CHECK (
  club_id IN (
    SELECT id FROM public.clubs_profiles WHERE user_id = auth.uid()
  )
);

-- Club owners can update requests for their clubs
CREATE POLICY "Club owners can update requests"
ON public.club_join_requests
FOR UPDATE
USING (
  club_id IN (
    SELECT id FROM public.clubs_profiles WHERE user_id = auth.uid()
  )
);

-- Update club_memberships to reference clubs_profiles
ALTER TABLE public.club_memberships 
DROP CONSTRAINT IF EXISTS club_memberships_club_id_fkey;

ALTER TABLE public.club_memberships
ADD CONSTRAINT club_memberships_club_id_fkey 
FOREIGN KEY (club_id) 
REFERENCES public.clubs_profiles(id) 
ON DELETE CASCADE;

-- Update member_count in clubs_profiles when memberships change
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clubs_profiles 
    SET member_count = member_count + 1 
    WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clubs_profiles 
    SET member_count = GREATEST(0, member_count - 1) 
    WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER club_membership_count_trigger
AFTER INSERT OR DELETE ON club_memberships
FOR EACH ROW
EXECUTE FUNCTION update_club_member_count();