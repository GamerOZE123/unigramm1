-- Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view universities
CREATE POLICY "Universities are viewable by everyone"
  ON public.universities
  FOR SELECT
  USING (true);

-- Insert initial universities
INSERT INTO public.universities (name, abbreviation) VALUES
  ('Shiv Nadar University', 'SNU'),
  ('Arizona State University', 'ASU')
ON CONFLICT (name) DO NOTHING;

-- Create carpool_rides table
CREATE TABLE IF NOT EXISTS public.carpool_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  ride_time TIME NOT NULL,
  ride_date DATE NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats > 0),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.carpool_rides ENABLE ROW LEVEL SECURITY;

-- Policies for carpool_rides
CREATE POLICY "Carpool rides are viewable by authenticated users"
  ON public.carpool_rides
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own rides"
  ON public.carpool_rides
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update their own rides"
  ON public.carpool_rides
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Users can delete their own rides"
  ON public.carpool_rides
  FOR DELETE
  TO authenticated
  USING (auth.uid() = driver_id);