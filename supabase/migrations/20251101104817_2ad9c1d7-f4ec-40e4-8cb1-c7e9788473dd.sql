
-- Add unique constraint to club_memberships to prevent duplicate memberships
ALTER TABLE club_memberships 
ADD CONSTRAINT club_memberships_club_user_unique 
UNIQUE (club_id, user_id);

-- Recreate the function with proper conflict handling
DROP FUNCTION IF EXISTS accept_club_join_request(uuid, uuid, uuid);

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
  ON CONFLICT (club_id, user_id) DO NOTHING;

  -- Update member count in clubs_profiles
  UPDATE clubs_profiles
  SET member_count = (
    SELECT COUNT(*) FROM club_memberships WHERE club_id = club_id_param
  )
  WHERE id = club_id_param;
END;
$$;
