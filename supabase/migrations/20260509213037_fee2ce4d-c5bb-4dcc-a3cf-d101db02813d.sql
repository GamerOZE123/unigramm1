CREATE TABLE IF NOT EXISTS public.campus_svg_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL UNIQUE,
  svg_content TEXT NOT NULL DEFAULT '',
  shapes JSONB NOT NULL DEFAULT '[]'::jsonb,
  boundary_coordinates JSONB,
  center_lat DECIMAL(10,8),
  center_lng DECIMAL(11,8),
  zoom_level INTEGER DEFAULT 17,
  last_edited_by TEXT,
  last_edited_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campus_svg_data ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read (mobile app loads campus map)
CREATE POLICY "Authenticated can view campus maps"
  ON public.campus_svg_data FOR SELECT
  TO authenticated
  USING (true);

-- Admin writes via has_role(admin)
CREATE POLICY "Admins can insert campus maps"
  ON public.campus_svg_data FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update campus maps"
  ON public.campus_svg_data FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete campus maps"
  ON public.campus_svg_data FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_campus_svg_data_university ON public.campus_svg_data(university_id);