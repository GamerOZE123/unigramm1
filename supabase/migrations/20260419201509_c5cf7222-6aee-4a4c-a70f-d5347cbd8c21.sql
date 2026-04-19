CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Admin',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Admin notes are managed exclusively via the verify-admin edge function or service role.
-- Block all public access; only service role (which bypasses RLS) can manage.
CREATE POLICY "Block public access to admin_notes"
ON public.admin_notes
FOR ALL
USING (false)
WITH CHECK (false);

CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_admin_notes_pinned_created ON public.admin_notes (pinned DESC, created_at DESC);