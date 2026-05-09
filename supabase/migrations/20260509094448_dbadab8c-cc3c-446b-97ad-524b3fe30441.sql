DROP POLICY IF EXISTS "Everyone can read poll votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Anyone can view poll votes" ON public.poll_votes;
CREATE POLICY "Users can view own poll votes"
  ON public.poll_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);