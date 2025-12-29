-- Fix RLS policy for likes table - replace ALL with specific INSERT/DELETE policies with proper WITH CHECK
DROP POLICY IF EXISTS "Users can manage their own likes" ON public.likes;

-- Create INSERT policy for likes
CREATE POLICY "Users can insert their own likes" 
ON public.likes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create DELETE policy for likes
CREATE POLICY "Users can delete their own likes" 
ON public.likes 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure comments INSERT policy targets authenticated role
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments" 
ON public.comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure posts INSERT policy targets authenticated role
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" 
ON public.posts 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);