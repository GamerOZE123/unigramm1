
CREATE OR REPLACE FUNCTION public.trigger_send_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://sdqmiwsvplykgsxrthfp.supabase.co/functions/v1/send-message-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW1pd3N2cGx5a2dzeHJ0aGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NjEwMzcsImV4cCI6MjA3MDEzNzAzN30.LbDPf7wuvAoqFHPmUnGz9kgA4dGFCO8OoowMi6szm90"}'::jsonb,
    body := '{}'::jsonb
  );
  RETURN NEW;
END;
$$;
