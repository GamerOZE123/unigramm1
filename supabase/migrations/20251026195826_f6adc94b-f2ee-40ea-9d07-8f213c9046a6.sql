-- Create enum for user roles (security best practice - roles in separate table)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'company')),
  price_monthly NUMERIC DEFAULT 0,
  price_yearly NUMERIC DEFAULT 0,
  features JSONB DEFAULT '{}',
  monthly_post_limit INTEGER DEFAULT 0,
  targeting_enabled BOOLEAN DEFAULT false,
  analytics_tier TEXT DEFAULT 'basic' CHECK (analytics_tier IN ('basic', 'advanced', 'premium')),
  priority_placement BOOLEAN DEFAULT false,
  custom_branding BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, subscription_id)
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions (viewable by all authenticated users)
CREATE POLICY "Subscriptions are viewable by authenticated users"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Seed default subscription plans for students
INSERT INTO public.subscriptions (name, user_type, price_monthly, price_yearly, features, monthly_post_limit, targeting_enabled, analytics_tier, priority_placement, custom_branding)
VALUES 
  ('Free', 'student', 0, 0, '{"access": "basic", "support": "standard"}', 0, false, 'basic', false, false);

-- Seed default subscription plans for companies
INSERT INTO public.subscriptions (name, user_type, price_monthly, price_yearly, features, monthly_post_limit, targeting_enabled, analytics_tier, priority_placement, custom_branding)
VALUES 
  ('Free', 'company', 0, 0, '{"posts_per_month": 5, "analytics": "basic", "targeting": "none", "support": "standard"}', 5, false, 'basic', false, false),
  ('Growth', 'company', 2999, 29990, '{"posts_per_month": 20, "analytics": "advanced", "targeting": "basic", "support": "priority", "featured_placement": "occasional"}', 20, true, 'advanced', false, false),
  ('Premium', 'company', 9999, 99990, '{"posts_per_month": "unlimited", "analytics": "premium", "targeting": "full", "support": "dedicated", "featured_placement": "always", "homepage_banners": true}', -1, true, 'premium', true, true);

-- Create function to check if company can create advertising post
CREATE OR REPLACE FUNCTION public.can_create_advertising_post(company_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_subscription RECORD;
  company_profile RECORD;
BEGIN
  -- Get company profile with current usage
  SELECT * INTO company_profile
  FROM public.company_profiles
  WHERE user_id = company_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get active subscription
  SELECT s.* INTO current_subscription
  FROM public.user_subscriptions us
  JOIN public.subscriptions s ON us.subscription_id = s.id
  WHERE us.user_id = company_user_id
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > now())
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if subscription has expired
  IF current_subscription.monthly_post_limit = -1 THEN
    -- Unlimited posts (Premium tier)
    RETURN true;
  END IF;
  
  -- Check if under post limit
  IF company_profile.monthly_posts_used < current_subscription.monthly_post_limit THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create trigger to update updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update updated_at on user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();