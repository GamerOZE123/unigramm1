-- Fix existing profiles: standardize university to use abbreviation
UPDATE profiles 
SET university = u.abbreviation
FROM universities u
WHERE profiles.university = u.name 
  AND profiles.university != u.abbreviation;