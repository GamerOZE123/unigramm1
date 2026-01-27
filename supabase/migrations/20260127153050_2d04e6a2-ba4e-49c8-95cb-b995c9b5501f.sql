-- Create device_tokens table for multi-device push notifications
CREATE TABLE public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  token_type text NOT NULL CHECK (token_type IN ('expo', 'fcm', 'web')),
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_name text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes for efficient lookups
CREATE INDEX idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX idx_device_tokens_token_type ON public.device_tokens(token_type);

-- Enable Row Level Security
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can manage their own tokens
CREATE POLICY "Users can manage their own tokens"
  ON public.device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Migrate existing web push tokens from profiles to device_tokens
INSERT INTO public.device_tokens (user_id, token, token_type, platform, created_at)
SELECT 
  user_id,
  push_token,
  COALESCE(push_token_type, 'web'),
  'web',
  COALESCE(push_token_updated_at, now())
FROM public.profiles
WHERE push_token IS NOT NULL
ON CONFLICT (token) DO NOTHING;