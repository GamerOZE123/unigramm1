
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  sender_user_id uuid DEFAULT NULL::uuid,
  post_id uuid DEFAULT NULL::uuid,
  comment_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
  caller uuid := auth.uid();
  is_admin boolean := false;
BEGIN
  IF target_user_id = sender_user_id THEN
    RETURN NULL;
  END IF;

  -- If invoked by an authenticated client, enforce strict checks.
  -- Triggers / service_role have caller IS NULL and bypass these checks.
  IF caller IS NOT NULL THEN
    IF sender_user_id IS NOT NULL AND sender_user_id <> caller THEN
      RAISE EXCEPTION 'Sender must match authenticated user';
    END IF;

    SELECT public.has_role(caller, 'admin'::app_role) INTO is_admin;

    IF NOT is_admin THEN
      IF notification_type = 'carpool_accepted' THEN
        IF NOT EXISTS (
          SELECT 1
          FROM public.carpool_ride_requests r
          JOIN public.carpool_rides cr ON cr.id = r.ride_id
          WHERE r.passenger_id = target_user_id
            AND cr.driver_id = caller
            AND r.status = 'accepted'
        ) THEN
          RAISE EXCEPTION 'Not authorized to send carpool_accepted to this user';
        END IF;
      ELSIF notification_type = 'club_accepted' THEN
        IF NOT EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          JOIN public.clubs_profiles cp ON cp.id = cm.club_id
          WHERE cm.user_id = target_user_id
            AND cp.user_id = caller
        ) THEN
          RAISE EXCEPTION 'Not authorized to send club_accepted to this user';
        END IF;
      ELSE
        RAISE EXCEPTION 'Notification type % cannot be created from client', notification_type;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title, message,
    related_user_id, related_post_id, related_comment_id
  ) VALUES (
    target_user_id, notification_type, notification_title, notification_message,
    sender_user_id, post_id, comment_id
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$function$;
