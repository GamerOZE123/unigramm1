-- Fix infinite recursion in chat_groups policies by creating a security definer function
-- This function checks if a user is a group member or creator without causing recursion

CREATE OR REPLACE FUNCTION public.is_group_member_or_creator(group_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_group_members cgm
    WHERE cgm.group_id = $1 AND cgm.user_id = $2
  ) OR EXISTS (
    SELECT 1 FROM chat_groups cg
    WHERE cg.id = $1 AND cg.created_by = $2
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(group_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_group_members cgm
    WHERE cgm.group_id = $1 
    AND cgm.user_id = $2 
    AND cgm.role IN ('admin', 'owner')
  ) OR EXISTS (
    SELECT 1 FROM chat_groups cg
    WHERE cg.id = $1 AND cg.created_by = $2
  );
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their groups" ON chat_groups;
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON chat_groups;
DROP POLICY IF EXISTS "Group creators and admins can delete groups" ON chat_groups;

-- Recreate policies using the security definer functions
CREATE POLICY "Users can view their groups" ON chat_groups
FOR SELECT
USING (is_group_member_or_creator(id, auth.uid()));

CREATE POLICY "Group creators and admins can update groups" ON chat_groups
FOR UPDATE
USING (is_group_admin(id, auth.uid()));

CREATE POLICY "Group creators and admins can delete groups" ON chat_groups
FOR DELETE
USING (is_group_admin(id, auth.uid()));