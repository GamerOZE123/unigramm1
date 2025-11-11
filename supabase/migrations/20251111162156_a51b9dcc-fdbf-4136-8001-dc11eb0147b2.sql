-- Fix chat_groups RLS by using database default for created_by
ALTER TABLE public.chat_groups 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Recreate the INSERT policy with a simpler check
DROP POLICY IF EXISTS "Users can create groups" ON public.chat_groups;

CREATE POLICY "Users can create groups" ON public.chat_groups
FOR INSERT 
TO authenticated
WITH CHECK (
  (created_by IS NULL OR created_by = auth.uid())
);