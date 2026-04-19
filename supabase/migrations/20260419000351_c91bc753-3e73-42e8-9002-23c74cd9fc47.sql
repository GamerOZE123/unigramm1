-- 1. QUESTS UPDATES
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS group_chat_id UUID REFERENCES public.chat_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS min_points_required INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_type TEXT DEFAULT 'mark';

-- 2. QUEST ENROLLMENTS (ensure exists with required columns)
CREATE TABLE IF NOT EXISTS public.quest_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled',
  proof_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quest_id, user_id)
);
ALTER TABLE public.quest_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view quest enrollments" ON public.quest_enrollments;
CREATE POLICY "Anyone can view quest enrollments" ON public.quest_enrollments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage their own enrollments" ON public.quest_enrollments;
CREATE POLICY "Users manage their own enrollments" ON public.quest_enrollments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. DISCOUNT BANNERS
CREATE TABLE IF NOT EXISTS public.discount_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  tap_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.discount_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.discount_banners;
CREATE POLICY "Anyone can view active banners" ON public.discount_banners FOR SELECT USING (is_active = true);

-- 4. STUDENT DISCOUNTS
CREATE TABLE IF NOT EXISTS public.student_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_code TEXT,
  category TEXT,
  min_points_required INT DEFAULT 0,
  redemption_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.student_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.student_discounts;
CREATE POLICY "Anyone can view active discounts" ON public.student_discounts FOR SELECT USING (is_active = true);

-- 5. DISCOUNT REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.discount_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID REFERENCES public.student_discounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(discount_id, user_id)
);
ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own redemptions" ON public.discount_redemptions;
CREATE POLICY "Users see own redemptions" ON public.discount_redemptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own redemptions" ON public.discount_redemptions;
CREATE POLICY "Users insert own redemptions" ON public.discount_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. POINTS LEDGER
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  points INT NOT NULL,
  reversed BOOLEAN DEFAULT false,
  post_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own ledger" ON public.points_ledger;
CREATE POLICY "Users view own ledger" ON public.points_ledger FOR SELECT USING (auth.uid() = user_id);

-- 7. USER POINTS
CREATE TABLE IF NOT EXISTS public.user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INT DEFAULT 0,
  level_name TEXT DEFAULT 'Newcomer',
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view points" ON public.user_points;
CREATE POLICY "Anyone view points" ON public.user_points FOR SELECT USING (true);