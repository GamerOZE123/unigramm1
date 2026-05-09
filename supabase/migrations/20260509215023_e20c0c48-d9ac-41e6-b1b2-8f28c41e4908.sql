DROP POLICY IF EXISTS "Admins can insert campus maps" ON public.campus_svg_data;
DROP POLICY IF EXISTS "Admins can update campus maps" ON public.campus_svg_data;
DROP POLICY IF EXISTS "Admins can delete campus maps" ON public.campus_svg_data;

CREATE POLICY "Authenticated can insert campus maps"
ON public.campus_svg_data FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update campus maps"
ON public.campus_svg_data FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete campus maps"
ON public.campus_svg_data FOR DELETE TO authenticated
USING (auth.uid() IS NOT NULL);