-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON public.chat_group_members;

-- Create security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_group_members
    WHERE group_id = group_uuid
    AND user_id = check_user_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view members of groups they belong to"
ON public.chat_group_members
FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));