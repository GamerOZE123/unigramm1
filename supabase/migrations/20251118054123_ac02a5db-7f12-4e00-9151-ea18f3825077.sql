-- Create student_store_items table for student-made products
CREATE TABLE public.student_store_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('physical', 'digital')),
  category TEXT,
  image_urls TEXT[],
  digital_file_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_store_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Student store items are viewable by everyone"
ON public.student_store_items
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own store items"
ON public.student_store_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store items"
ON public.student_store_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store items"
ON public.student_store_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create student_store_purchases table
CREATE TABLE public.student_store_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES student_store_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for purchases
ALTER TABLE public.student_store_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for purchases
CREATE POLICY "Users can view their own purchases"
ON public.student_store_purchases
FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create purchases"
ON public.student_store_purchases
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Sellers can view purchases of their items
CREATE POLICY "Sellers can view purchases of their items"
ON public.student_store_purchases
FOR SELECT
USING (item_id IN (
  SELECT id FROM student_store_items WHERE user_id = auth.uid()
));