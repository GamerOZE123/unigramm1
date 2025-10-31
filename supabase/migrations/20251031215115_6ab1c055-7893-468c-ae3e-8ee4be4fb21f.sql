-- Add missing columns to carpool_rides table
ALTER TABLE public.carpool_rides 
ADD COLUMN IF NOT EXISTS car_type text,
ADD COLUMN IF NOT EXISTS baggage_allowed integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS notes text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_carpool_rides_date ON public.carpool_rides(ride_date, ride_time);
CREATE INDEX IF NOT EXISTS idx_carpool_rides_active ON public.carpool_rides(is_active) WHERE is_active = true;