-- Create a basic RPC function that works with existing columns
CREATE OR REPLACE FUNCTION public.get_unswiped_jobs_for_student(student_user_id uuid)
RETURNS TABLE (
  job_id uuid,
  title text,
  description text,
  company_name text,
  location text,
  salary_range text,
  job_type text,
  skills_required text[],
  company_logo text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    j.id as job_id,
    COALESCE(j.job_title, 'Job Title') as title,
    'Job description placeholder' as description,
    'Company Name' as company_name,
    'Location' as location,
    'Salary Range' as salary_range,
    'Full-time' as job_type,
    ARRAY[]::text[] as skills_required,
    null as company_logo
  FROM jobs j
  WHERE j.id NOT IN (
    SELECT job_id 
    FROM job_swipes js
    WHERE js.job_id IS NOT NULL
  )
  ORDER BY j.user_id DESC
  LIMIT 50;
$$;