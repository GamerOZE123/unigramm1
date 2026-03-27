INSERT INTO public.university_features (key, display_name, icon, is_visible, is_locked, sort_order)
VALUES ('jobs', 'Jobs & Internships', '💼', true, false, 8)
ON CONFLICT DO NOTHING;