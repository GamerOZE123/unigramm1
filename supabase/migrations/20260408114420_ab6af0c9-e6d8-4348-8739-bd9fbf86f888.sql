-- Enable RLS (may already be enabled, using IF NOT EXISTS pattern)
ALTER TABLE public.app_announcements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all announcements
CREATE POLICY "Authenticated users can read announcements"
ON public.app_announcements
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create announcements
CREATE POLICY "Authenticated users can create announcements"
ON public.app_announcements
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update announcements
CREATE POLICY "Authenticated users can update announcements"
ON public.app_announcements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete announcements
CREATE POLICY "Authenticated users can delete announcements"
ON public.app_announcements
FOR DELETE
TO authenticated
USING (true);