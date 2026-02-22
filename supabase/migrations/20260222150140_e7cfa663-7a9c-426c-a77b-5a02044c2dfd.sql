
-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a trigger function that calls the edge function when a notification is queued
CREATE OR REPLACE FUNCTION public.trigger_send_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the edge function via pg_net (async HTTP POST)
  PERFORM net.http_post(
    url := 'https://sdqmiwsvplykgsxrthfp.supabase.co/functions/v1/send-message-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Create trigger on message_notifications insert
CREATE TRIGGER on_notification_queued
  AFTER INSERT ON public.message_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_notification();
