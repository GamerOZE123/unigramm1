-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create their own groups" ON public.chat_groups;

-- Create a new permissive policy for creating groups
CREATE POLICY "Users can create their own groups" 
ON public.chat_groups 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);