
-- Communities table
CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  university text NOT NULL,
  created_by uuid NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Community members table
CREATE TABLE public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Community messages table
CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_community_members_community ON public.community_members(community_id);
CREATE INDEX idx_community_members_user ON public.community_members(user_id);
CREATE INDEX idx_community_messages_community ON public.community_messages(community_id);
CREATE INDEX idx_communities_university ON public.communities(university);

-- Trigger: auto-update member_count
CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_community_member_count
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- Security definer function for membership check
CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = p_community_id AND user_id = p_user_id
  );
$$;

-- RLS: communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view public communities"
ON public.communities FOR SELECT TO authenticated
USING (is_public = true);

CREATE POLICY "Authenticated can create communities"
ON public.communities FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update community"
ON public.communities FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete community"
ON public.communities FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- RLS: community_members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view members"
ON public.community_members FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can join communities"
ON public.community_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave or creator can remove"
ON public.community_members FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.created_by = auth.uid()
  )
);

-- RLS: community_messages
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages"
ON public.community_messages FOR SELECT TO authenticated
USING (public.is_community_member(community_id, auth.uid()));

CREATE POLICY "Members can send messages"
ON public.community_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_community_member(community_id, auth.uid())
);

CREATE POLICY "Users can delete own messages"
ON public.community_messages FOR DELETE TO authenticated
USING (auth.uid() = sender_id);

-- Enable realtime for community_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
