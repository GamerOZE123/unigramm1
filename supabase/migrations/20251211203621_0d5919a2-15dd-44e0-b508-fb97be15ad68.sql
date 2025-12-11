-- Create startup_stages table for custom progress stages
CREATE TABLE public.startup_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.student_startups(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  is_completed boolean DEFAULT false,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.startup_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Stages are viewable by everyone" ON public.startup_stages
  FOR SELECT USING (true);

CREATE POLICY "Startup owners can create stages" ON public.startup_stages
  FOR INSERT WITH CHECK (
    startup_id IN (SELECT id FROM public.student_startups WHERE user_id = auth.uid())
  );

CREATE POLICY "Startup owners can update stages" ON public.startup_stages
  FOR UPDATE USING (
    startup_id IN (SELECT id FROM public.student_startups WHERE user_id = auth.uid())
  );

CREATE POLICY "Startup owners can delete stages" ON public.startup_stages
  FOR DELETE USING (
    startup_id IN (SELECT id FROM public.student_startups WHERE user_id = auth.uid())
  );