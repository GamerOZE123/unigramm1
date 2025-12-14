-- Create the lovable-uploads storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lovable-uploads', 'lovable-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lovable-uploads');

-- Allow public read access
CREATE POLICY "Public read access for lovable-uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lovable-uploads');

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lovable-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lovable-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);