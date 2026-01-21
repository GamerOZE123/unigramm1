-- Add location columns to universities table for proximity-based feed ranking
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add index for feed performance
CREATE INDEX IF NOT EXISTS idx_universities_location ON universities(country, state);

-- Remove redundant column (duration is already in university_courses table)
ALTER TABLE universities DROP COLUMN IF EXISTS program_duration_years;

-- Add comment for documentation
COMMENT ON COLUMN universities.state IS 'State/region where the university is located';
COMMENT ON COLUMN universities.country IS 'Country where the university is located';