-- Drop existing policies
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.item_favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.item_favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.item_favorites;

-- Create proper RLS policies for item_favorites
CREATE POLICY "Users can view their own favorites"
ON public.item_favorites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
ON public.item_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
ON public.item_favorites
FOR DELETE
USING (auth.uid() = user_id);