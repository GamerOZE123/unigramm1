-- Fix the INSERT policy for chat_groups to ensure proper authentication context
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;

CREATE POLICY "Users can create groups" ON public.chat_groups
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = created_by
);