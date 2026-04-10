
CREATE OR REPLACE FUNCTION public.notify_waitlist_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    '00df11eb-dfdf-4b18-8bf3-d7d8823af9b5'::uuid,
    'system',
    'New Waitlist Signup',
    COALESCE(NEW.full_name, 'Someone') || ' (' || NEW.email || ') joined the waitlist'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_waitlist_signup
AFTER INSERT ON public.early_access_signups
FOR EACH ROW
EXECUTE FUNCTION public.notify_waitlist_signup();
