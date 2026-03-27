CREATE TABLE public.broadcast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by TEXT NOT NULL DEFAULT 'admin',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  deep_link TEXT,
  audience_type TEXT NOT NULL DEFAULT 'all',
  recipient_count INTEGER NOT NULL DEFAULT 0,
  selected_user_ids UUID[],
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_logs ENABLE ROW LEVEL SECURITY;