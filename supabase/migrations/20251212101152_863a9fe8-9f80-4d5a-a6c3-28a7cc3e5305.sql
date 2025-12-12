-- Create startup gallery table for storing gallery images
CREATE TABLE public.startup_gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES public.student_startups(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.startup_gallery_images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Gallery images are viewable by everyone" 
ON public.startup_gallery_images 
FOR SELECT 
USING (true);

CREATE POLICY "Startup owners can manage gallery images" 
ON public.startup_gallery_images 
FOR ALL 
USING (
  startup_id IN (SELECT id FROM student_startups WHERE user_id = auth.uid())
);

-- Create index for faster queries
CREATE INDEX idx_startup_gallery_startup_id ON public.startup_gallery_images(startup_id);
CREATE INDEX idx_startup_gallery_order ON public.startup_gallery_images(startup_id, order_index);