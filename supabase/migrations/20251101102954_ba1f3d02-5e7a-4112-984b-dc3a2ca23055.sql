-- Drop existing function if it exists
DROP FUNCTION IF EXISTS accept_club_join_request(uuid, uuid, uuid);

-- Create function to accept join requests and create memberships
CREATE OR REPLACE FUNCTION accept_club_join_request(
  request_id_param uuid,
  student_id_param uuid,
  club_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the request status to accepted
  UPDATE club_join_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id_param;

  -- Insert into club_memberships if not already exists
  INSERT INTO club_memberships (club_id, user_id, role)
  VALUES (club_id_param, student_id_param, 'member')
  ON CONFLICT DO NOTHING;

  -- Update member count in clubs_profiles
  UPDATE clubs_profiles
  SET member_count = (
    SELECT COUNT(*) FROM club_memberships WHERE club_id = club_id_param
  )
  WHERE id = club_id_param;
END;
$$;

-- Update RLS policy to allow club owners to add members via function
DROP POLICY IF EXISTS "Club owners can add members" ON club_memberships;
CREATE POLICY "Club owners can add members"
ON club_memberships
FOR INSERT
WITH CHECK (
  club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);