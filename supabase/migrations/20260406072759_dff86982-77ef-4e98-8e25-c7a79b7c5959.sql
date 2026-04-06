INSERT INTO public.feature_flags (key, is_enabled) VALUES 
  ('academic_actions', true),
  ('academic_actions_visible', true)
ON CONFLICT (key) DO NOTHING;