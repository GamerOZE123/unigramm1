
-- Drop the separate post-videos bucket policies
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;

-- Add policies for post_videos/ folder inside the existing 'posts' bucket
CREATE POLICY "Authenticated users can upload videos to posts bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'posts' AND name LIKE 'post_videos/%');

CREATE POLICY "Users can delete own videos in posts bucket"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'posts' AND name LIKE 'post_videos/%');
