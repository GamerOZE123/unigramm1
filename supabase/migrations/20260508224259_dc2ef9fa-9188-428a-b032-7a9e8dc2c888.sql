
-- FIX 3: poll_votes - remove public SELECT
DROP POLICY IF EXISTS "Anyone can view poll votes" ON public.poll_votes;
-- Keep "Everyone can read poll votes" (authenticated, USING true) so polls still display counts

-- FIX 5: carpool_rides - allow authenticated browsing of active rides
CREATE POLICY "Authenticated can browse active rides"
  ON public.carpool_rides FOR SELECT
  TO authenticated
  USING (is_active = true);

-- FIX 6: chat_group_members - restrict SELECT to group members only
DROP POLICY IF EXISTS "Authenticated users can view group members" ON public.chat_group_members;
CREATE POLICY "Group members can view membership"
  ON public.chat_group_members FOR SELECT
  TO authenticated
  USING (public.is_group_member(auth.uid(), group_id));

-- FIX 7: quest_enrollments - drop broad SELECT; keep owner + quest creator visibility
DROP POLICY IF EXISTS "Authenticated users can view quest enrollments" ON public.quest_enrollments;
CREATE POLICY "Quest creators can view enrollments for their quests"
  ON public.quest_enrollments FOR SELECT
  TO authenticated
  USING (quest_id IN (SELECT id FROM public.quests WHERE creator_id = auth.uid()));
-- "Users can view their own quest enrollments" already exists for the enrollee.

-- FIX 8: anonymous_message_reactions - require auth
DROP POLICY IF EXISTS "Users can view anonymous message reactions" ON public.anonymous_message_reactions;
CREATE POLICY "Authenticated can view anonymous message reactions"
  ON public.anonymous_message_reactions FOR SELECT
  TO authenticated
  USING (true);
