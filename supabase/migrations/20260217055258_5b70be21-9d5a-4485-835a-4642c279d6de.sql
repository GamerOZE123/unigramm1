
-- Table: confessions
CREATE TABLE public.confessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  university text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view confessions"
  ON public.confessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create confessions"
  ON public.confessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own confessions"
  ON public.confessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Table: confession_reactions
CREATE TABLE public.confession_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id uuid NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (confession_id, user_id, emoji)
);

ALTER TABLE public.confession_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reactions"
  ON public.confession_reactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON public.confession_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON public.confession_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Table: confession_comments
CREATE TABLE public.confession_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id uuid NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.confession_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON public.confession_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON public.confession_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.confession_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
