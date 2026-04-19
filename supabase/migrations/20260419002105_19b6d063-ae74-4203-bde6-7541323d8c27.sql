INSERT INTO public.university_features (key, display_name, icon, is_visible, is_locked, sort_order)
VALUES
  ('quests', 'Quests', '🎯', true, false, 9),
  ('discounts', 'Student Discounts', '🎟️', true, false, 10)
ON CONFLICT (key) DO UPDATE SET
  is_visible = true,
  is_locked = false,
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon;