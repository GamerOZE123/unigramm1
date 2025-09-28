-- Add policies for remaining tables that have RLS enabled but no policies

-- Add minimal policies for tables without user context
CREATE POLICY "No access by default" ON public.advertising_clicks FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.advertising_likes FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.advertising_post_views FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.auction_bids FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.challenge_participants FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.challenge_progress FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.club_memberships FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.company_profiles FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.flow_state FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.holiday_attendees FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.homepage_banner_clicks FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.homepage_banner_views FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.homepage_banners FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.item_favorites FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.job_applications FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.job_swipes FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.message_reactions FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.message_status FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.ranked_posts FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.scheduled_workouts FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.student_profiles FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.typing_status FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.user_presence FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.workout_sessions FOR ALL USING (false);
CREATE POLICY "No access by default" ON public.workouts FOR ALL USING (false);

-- Enable RLS on remaining auth-related tables if they exist in public schema
DO $$
BEGIN
  -- These might not exist, so we use exception handling
  BEGIN
    ALTER TABLE public.mfa_amr_claims ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.mfa_challenges ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.mfa_factors ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.one_time_tokens ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.saml_providers ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.saml_relay_states ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.sso_domains ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
END $$;

-- Add restrictive policies for auth tables (these should generally not be accessible)
CREATE POLICY "System only" ON public.mfa_amr_claims FOR ALL USING (false);
CREATE POLICY "System only" ON public.mfa_challenges FOR ALL USING (false);  
CREATE POLICY "System only" ON public.mfa_factors FOR ALL USING (false);
CREATE POLICY "System only" ON public.one_time_tokens FOR ALL USING (false);
CREATE POLICY "System only" ON public.refresh_tokens FOR ALL USING (false);
CREATE POLICY "System only" ON public.saml_providers FOR ALL USING (false);
CREATE POLICY "System only" ON public.saml_relay_states FOR ALL USING (false);
CREATE POLICY "System only" ON public.sessions FOR ALL USING (false);
CREATE POLICY "System only" ON public.sso_domains FOR ALL USING (false);
CREATE POLICY "System only" ON public.sso_providers FOR ALL USING (false);
CREATE POLICY "System only" ON public.oauth_clients FOR ALL USING (false);
CREATE POLICY "System only" ON public.schema_migrations FOR ALL USING (false);