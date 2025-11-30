-- Add logo_url column to student_startups table
ALTER TABLE student_startups
ADD COLUMN logo_url text;

-- Add comment to describe the column
COMMENT ON COLUMN student_startups.logo_url IS 'URL to the startup logo image';