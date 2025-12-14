-- Drop the existing check constraint
ALTER TABLE public.item_favorites DROP CONSTRAINT item_favorites_item_type_check;

-- Add a new check constraint that includes 'startup'
ALTER TABLE public.item_favorites ADD CONSTRAINT item_favorites_item_type_check 
CHECK (item_type = ANY (ARRAY['marketplace'::text, 'auction'::text, 'startup'::text]));