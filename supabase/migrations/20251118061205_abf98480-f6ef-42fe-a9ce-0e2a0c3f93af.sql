-- Create student_stores table for managing student stores
CREATE TABLE public.student_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  store_description text,
  store_logo_url text,
  payment_methods jsonb DEFAULT '[]'::jsonb,
  bank_details jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.student_stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Student stores are viewable by everyone"
  ON public.student_stores
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own store"
  ON public.student_stores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store"
  ON public.student_stores
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store"
  ON public.student_stores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add store_id to student_store_items
ALTER TABLE public.student_store_items
ADD COLUMN store_id uuid REFERENCES public.student_stores(id) ON DELETE CASCADE;

-- Update existing items to link to user's store (if any)
-- This will be null for now until stores are created

-- Create trigger to update updated_at
CREATE TRIGGER update_student_stores_updated_at
  BEFORE UPDATE ON public.student_stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();