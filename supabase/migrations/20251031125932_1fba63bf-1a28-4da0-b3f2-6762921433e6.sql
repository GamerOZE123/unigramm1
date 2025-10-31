-- Allow students to send join requests to clubs
CREATE POLICY "Students can send join requests"
ON public.club_join_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);