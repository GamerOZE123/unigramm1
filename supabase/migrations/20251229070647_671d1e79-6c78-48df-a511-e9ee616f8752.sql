-- Fix storage RLS policy for post-images bucket to ensure proper authentication
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Clean up orphaned likes records (likes pointing to deleted posts)
DELETE FROM public.likes 
WHERE post_id NOT IN (SELECT id FROM public.posts);

-- Clean up orphaned post_views records
DELETE FROM public.post_views 
WHERE post_id NOT IN (SELECT id FROM public.posts);

-- Clean up orphaned comments records
DELETE FROM public.comments 
WHERE post_id NOT IN (SELECT id FROM public.posts);

-- Add foreign key constraints with CASCADE DELETE for likes table to posts
ALTER TABLE public.likes
ADD CONSTRAINT likes_post_id_fkey
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Add foreign key for post_views
ALTER TABLE public.post_views
ADD CONSTRAINT post_views_post_id_fkey
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- Add foreign key for comments if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'comments_post_id_fkey' 
    AND conrelid = 'public.comments'::regclass
  ) THEN
    ALTER TABLE public.comments
    ADD CONSTRAINT comments_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  END IF;
END $$;