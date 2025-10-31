-- Add request_type column to club_join_requests to distinguish between student requests and club invitations
ALTER TABLE club_join_requests 
ADD COLUMN request_type text NOT NULL DEFAULT 'invitation' CHECK (request_type IN ('request', 'invitation'));

-- Update existing records: if the club created it, it's an invitation; if student might have created it, mark as request
-- For simplicity, we'll mark all existing as invitations since the current flow is club->student invites
UPDATE club_join_requests SET request_type = 'invitation' WHERE request_type IS NULL;

-- Drop old policies
DROP POLICY IF EXISTS "Club owners can view requests for their clubs" ON club_join_requests;
DROP POLICY IF EXISTS "Students can view their own requests" ON club_join_requests;
DROP POLICY IF EXISTS "Club owners can create join requests" ON club_join_requests;
DROP POLICY IF EXISTS "Students can send join requests" ON club_join_requests;
DROP POLICY IF EXISTS "Club owners can update requests" ON club_join_requests;
DROP POLICY IF EXISTS "Students can update their own requests" ON club_join_requests;
DROP POLICY IF EXISTS "Students can delete their own requests" ON club_join_requests;

-- New policies for viewing
-- Club owners see student requests (type='request') sent to their club
CREATE POLICY "Club owners can view student requests"
ON club_join_requests
FOR SELECT
USING (
  request_type = 'request' 
  AND club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);

-- Students see club invitations (type='invitation') sent to them
CREATE POLICY "Students can view club invitations"
ON club_join_requests
FOR SELECT
USING (
  request_type = 'invitation' 
  AND auth.uid() = student_id
);

-- New policies for creating
-- Students can send requests to clubs
CREATE POLICY "Students can send join requests to clubs"
ON club_join_requests
FOR INSERT
WITH CHECK (
  auth.uid() = student_id 
  AND request_type = 'request'
);

-- Club owners can send invitations to students
CREATE POLICY "Club owners can send invitations to students"
ON club_join_requests
FOR INSERT
WITH CHECK (
  request_type = 'invitation'
  AND club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);

-- New policies for updating
-- Club owners can update student requests (to accept/reject)
CREATE POLICY "Club owners can update student requests"
ON club_join_requests
FOR UPDATE
USING (
  request_type = 'request'
  AND club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);

-- Students can update club invitations (to accept/reject)
CREATE POLICY "Students can update club invitations"
ON club_join_requests
FOR UPDATE
USING (
  request_type = 'invitation'
  AND auth.uid() = student_id
);

-- Students can delete their own sent requests
CREATE POLICY "Students can delete their own requests"
ON club_join_requests
FOR DELETE
USING (
  request_type = 'request'
  AND auth.uid() = student_id
);