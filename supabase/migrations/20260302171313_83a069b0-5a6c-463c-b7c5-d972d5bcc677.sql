
-- Add video_url column to posts
ALTER TABLE public.posts ADD COLUMN video_url text;

-- Create post-videos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('post-videos', 'post-videos', true);

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-videos');

-- Allow public read access to videos
CREATE POLICY "Public read access for videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-videos');

-- Allow users to update their own videos
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-videos' AND (storage.foldername(name))[1] = 'post_videos');

-- Allow users to delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-videos');
