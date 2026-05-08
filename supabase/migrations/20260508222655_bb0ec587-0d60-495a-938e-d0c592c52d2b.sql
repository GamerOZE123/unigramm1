-- Remove client-side INSERT on notifications; only triggers/SECURITY DEFINER functions create them
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

-- Column-level lockdown of student_stores.bank_details
REVOKE SELECT (bank_details) ON public.student_stores FROM anon, authenticated;