-- Add Advertising to university_features
INSERT INTO university_features (key, display_name, icon, is_visible, is_locked, sort_order)
VALUES ('advertising', 'Advertising', '📢', true, false, 0)
ON CONFLICT DO NOTHING;

-- Add maintenance_mode to app_config
INSERT INTO app_config (key, value, description)
VALUES ('maintenance_mode', 'false', 'When enabled, the app shows a maintenance screen to all users')
ON CONFLICT DO NOTHING;