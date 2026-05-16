
-- ============================================
-- ISSUE 1: Fix device_tokens RLS + constraints
-- ============================================

-- Ensure RLS enabled
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Drop redundant/overlapping policies
DROP POLICY IF EXISTS "Users can read own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can insert own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can update own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can delete own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can upsert own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Service role full access" ON public.device_tokens;

-- Clean, explicit per-operation policies
CREATE POLICY "device_tokens_select_own"
  ON public.device_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "device_tokens_insert_own"
  ON public.device_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "device_tokens_update_own"
  ON public.device_tokens FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "device_tokens_delete_own"
  ON public.device_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "device_tokens_service_role_all"
  ON public.device_tokens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add updated_at column if missing
ALTER TABLE public.device_tokens
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add unique (user_id, platform) for clean upserts (only if no duplicates exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.device_tokens'::regclass
      AND conname  = 'device_tokens_user_platform_uc'
  ) THEN
    -- Deduplicate first, keep most recent per (user_id, platform)
    DELETE FROM public.device_tokens a
    USING public.device_tokens b
    WHERE a.user_id = b.user_id
      AND a.platform = b.platform
      AND a.ctid < b.ctid;

    ALTER TABLE public.device_tokens
      ADD CONSTRAINT device_tokens_user_platform_uc UNIQUE (user_id, platform);
  END IF;
END$$;

-- Auto-update updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.device_tokens_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS device_tokens_set_updated_at_trg ON public.device_tokens;
CREATE TRIGGER device_tokens_set_updated_at_trg
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION public.device_tokens_set_updated_at();
