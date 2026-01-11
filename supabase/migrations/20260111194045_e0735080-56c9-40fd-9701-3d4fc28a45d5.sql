-- Insert sample university courses data
INSERT INTO public.university_courses (university_id, course_name, duration_years, total_semesters, force_enable_graduation) VALUES
-- Arizona State University courses
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Computer Science', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Business Administration', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Engineering', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Psychology', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Nursing', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Communications', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Biology', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Economics', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Political Science', 4, 8, false),
('16b0f605-5a19-4eea-9025-ed2bd2ed3119', 'Art & Design', 4, 8, false),
-- SNU courses (with varying durations)
('277a232e-294b-423d-affa-1781a3797c77', 'Computer Science', 4, 8, false),
('277a232e-294b-423d-affa-1781a3797c77', 'Business Administration', 3, 6, false),
('277a232e-294b-423d-affa-1781a3797c77', 'Engineering', 4, 8, false),
('277a232e-294b-423d-affa-1781a3797c77', 'Medicine', 6, 12, true),
('277a232e-294b-423d-affa-1781a3797c77', 'Law', 5, 10, false),
('277a232e-294b-423d-affa-1781a3797c77', 'Arts & Humanities', 3, 6, false),
('277a232e-294b-423d-affa-1781a3797c77', 'Architecture', 5, 10, false),
('277a232e-294b-423d-affa-1781a3797c77', 'Pharmacy', 5, 10, true),
('277a232e-294b-423d-affa-1781a3797c77', 'Education', 4, 8, false),
('277a232e-294b-423d-affa-1781a3797c77', 'Economics', 4, 8, false)
ON CONFLICT DO NOTHING;