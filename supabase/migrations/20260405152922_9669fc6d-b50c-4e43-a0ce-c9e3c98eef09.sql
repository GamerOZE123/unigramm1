
-- Dating module control (single row)
create table if not exists public.dating_config (
  id uuid primary key default gen_random_uuid(),
  is_enabled boolean default false,
  is_paused boolean default false,
  launch_at timestamptz null,
  waitlist_threshold int default 50,
  enrolled_count int default 0,
  show_timer_on_home boolean default false,
  swipe_visibility text default 'bucketed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.dating_config enable row level security;

create policy "Anyone can read dating_config"
  on public.dating_config for select
  using (true);

-- Insert default row
insert into public.dating_config (id) values (gen_random_uuid()) on conflict do nothing;

-- Ice-breaker questions (admin managed)
create table if not exists public.dating_icebreakers (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text default 'general',
  is_active boolean default true,
  display_order int default 0,
  created_at timestamptz default now()
);

alter table public.dating_icebreakers enable row level security;

create policy "Anyone can read active icebreakers"
  on public.dating_icebreakers for select
  using (true);

insert into public.dating_icebreakers (question, category, display_order) values
  ('What''s your go-to spot on campus?', 'campus', 1),
  ('Last place you travelled to?', 'travel', 2),
  ('Song you''ve had on repeat lately?', 'music', 3),
  ('Best thing about being at university?', 'campus', 4),
  ('If you could travel anywhere tomorrow, where?', 'travel', 5),
  ('Your most underrated food recommendation?', 'fun', 6),
  ('What are you procrastinating on right now?', 'campus', 7),
  ('Best trip you''ve ever taken?', 'travel', 8);

-- Dating profile prompts (admin managed)
create table if not exists public.dating_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_text text not null,
  category text default 'general',
  is_active boolean default true,
  display_order int default 0,
  created_at timestamptz default now()
);

alter table public.dating_prompts enable row level security;

create policy "Anyone can read active prompts"
  on public.dating_prompts for select
  using (true);

insert into public.dating_prompts (prompt_text, category, display_order) values
  ('A place I need to go before I graduate', 'travel', 1),
  ('My go-to song right now', 'music', 2),
  ('Best trip I''ve taken', 'travel', 3),
  ('My campus guilty pleasure', 'campus', 4),
  ('I get way too excited about', 'fun', 5),
  ('Two truths and a lie', 'fun', 6),
  ('The artist I''d see live no matter what', 'music', 7),
  ('My love language is', 'general', 8),
  ('Weirdly proud of', 'fun', 9),
  ('Looking for someone who', 'general', 10);

-- User preference data (passive collection)
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete cascade unique not null,
  places jsonb default '[]',
  music jsonb default '[]',
  interests jsonb default '[]',
  travel jsonb default '[]',
  raw_signals jsonb default '[]',
  updated_at timestamptz default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can view own preferences"
  on public.user_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  to authenticated
  using (auth.uid() = user_id);
