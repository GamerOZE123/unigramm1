-- Allow students to update their own join requests (accept/reject)
CREATE POLICY "Students can update their own requests"
ON public.club_join_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Also allow students to delete their own requests if they want to decline
CREATE POLICY "Students can delete their own requests"
ON public.club_join_requests
FOR DELETE
TO authenticated
USING (auth.uid() = student_id);