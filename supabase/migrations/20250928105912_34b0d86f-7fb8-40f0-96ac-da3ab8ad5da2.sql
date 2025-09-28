-- Enable RLS on all remaining tables to fix security issues

-- Enable RLS on all advertising tables
ALTER TABLE public.advertising_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertising_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertising_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertising_posts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on auction tables
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables
ALTER TABLE public.audit_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleared_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banner_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banner_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranked_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Create basic policies for tables that should be publicly readable
CREATE POLICY "Public read access" ON public.trending_hashtags FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.fitness_challenges FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.holiday_events FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.marketplace_categories FOR SELECT USING (true);

-- Create user-specific policies for user-owned data
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Create restrictive policies for sensitive tables (no access by default)
CREATE POLICY "No access" ON public.audit_log_entries FOR ALL USING (false);
CREATE POLICY "No access" ON public.identities FOR ALL USING (false);
CREATE POLICY "No access" ON public.instances FOR ALL USING (false);

-- User-specific policies for personal data
CREATE POLICY "Users own their data" ON public.blocked_users FOR ALL USING (auth.uid() = blocked_user_id);
CREATE POLICY "Users own their data" ON public.cleared_chats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their data" ON public.deleted_chats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own their data" ON public.recent_chats FOR ALL USING (auth.uid() = conversation_id);

-- Add user_id columns where needed for proper RLS
ALTER TABLE public.advertising_posts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.marketplace_items ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create policies for user-owned content
CREATE POLICY "Users can manage their advertising posts" ON public.advertising_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view advertising posts" ON public.advertising_posts FOR SELECT USING (true);

CREATE POLICY "Users can manage their auctions" ON public.auctions FOR ALL USING (auth.uid() = user_id);  
CREATE POLICY "Public can view auctions" ON public.auctions FOR SELECT USING (true);

CREATE POLICY "Users can manage their marketplace items" ON public.marketplace_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view marketplace items" ON public.marketplace_items FOR SELECT USING (true);

CREATE POLICY "Companies can manage their jobs" ON public.jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view jobs" ON public.jobs FOR SELECT USING (true);