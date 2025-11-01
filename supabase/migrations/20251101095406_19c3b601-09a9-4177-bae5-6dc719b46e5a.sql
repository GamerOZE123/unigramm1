-- Allow students to view their own requests sent to clubs
CREATE POLICY "Students can view their own requests"
ON public.club_join_requests
FOR SELECT
TO authenticated
USING (
  (request_type = 'request' AND auth.uid() = student_id)
);

-- Allow club owners to view invitations they sent
CREATE POLICY "Club owners can view their sent invitations"
ON public.club_join_requests
FOR SELECT
TO authenticated
USING (
  (request_type = 'invitation' AND club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  ))
);

-- Allow students to delete their own pending requests
CREATE POLICY "Students can delete their pending requests"
ON public.club_join_requests
FOR DELETE
TO authenticated
USING (
  (request_type = 'request' AND auth.uid() = student_id AND status = 'pending')
);

-- Allow club owners to delete their sent invitations
CREATE POLICY "Club owners can delete their sent invitations"
ON public.club_join_requests
FOR DELETE
TO authenticated
USING (
  (request_type = 'invitation' AND status = 'pending' AND club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  ))
);