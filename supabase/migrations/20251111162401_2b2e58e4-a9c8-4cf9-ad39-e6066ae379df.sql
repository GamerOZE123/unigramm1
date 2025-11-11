-- Fix chat_groups RLS to allow authenticated users to create groups
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;

CREATE POLICY "Users can create groups" ON public.chat_groups
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Remove the default since it doesn't work with RLS checks
ALTER TABLE public.chat_groups 
ALTER COLUMN created_by DROP DEFAULT;