-- Create carpool ride requests table
CREATE TABLE public.carpool_ride_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.carpool_rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ride_id, passenger_id)
);

-- Enable RLS
ALTER TABLE public.carpool_ride_requests ENABLE ROW LEVEL SECURITY;

-- Policies for ride requests
CREATE POLICY "Ride requests are viewable by drivers and passengers"
ON public.carpool_ride_requests
FOR SELECT
USING (
  auth.uid() = passenger_id OR 
  auth.uid() IN (
    SELECT driver_id FROM carpool_rides WHERE id = ride_id
  )
);

CREATE POLICY "Users can create ride requests"
ON public.carpool_ride_requests
FOR INSERT
WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update ride request status"
ON public.carpool_ride_requests
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT driver_id FROM carpool_rides WHERE id = ride_id
  )
);

CREATE POLICY "Passengers can delete their own requests"
ON public.carpool_ride_requests
FOR DELETE
USING (auth.uid() = passenger_id);

-- Add indexes for performance
CREATE INDEX idx_carpool_ride_requests_ride_id ON public.carpool_ride_requests(ride_id);
CREATE INDEX idx_carpool_ride_requests_passenger_id ON public.carpool_ride_requests(passenger_id);
CREATE INDEX idx_carpool_ride_requests_status ON public.carpool_ride_requests(status);