-- Add policy to allow club owners to remove members from their clubs
CREATE POLICY "Club owners can remove members from their clubs"
ON club_memberships
FOR DELETE
USING (
  club_id IN (
    SELECT id FROM clubs_profiles WHERE user_id = auth.uid()
  )
);