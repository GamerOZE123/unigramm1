-- Fix infinite recursion in chat_group_members policies
DROP POLICY IF EXISTS "Group creators can add members" ON chat_group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON chat_group_members;

-- Create new policies without recursion
CREATE POLICY "Group creators can add members" ON chat_group_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM chat_groups 
    WHERE chat_groups.id = chat_group_members.group_id 
    AND chat_groups.created_by = auth.uid()
  )
);

CREATE POLICY "Admins can remove members" ON chat_group_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chat_groups 
    WHERE chat_groups.id = chat_group_members.group_id 
    AND chat_groups.created_by = auth.uid()
  )
);