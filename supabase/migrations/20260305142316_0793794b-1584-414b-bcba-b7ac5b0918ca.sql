
DROP POLICY IF EXISTS "Public can view all projects" ON public.projects;
CREATE POLICY "Public can view public projects"
  ON public.projects FOR SELECT
  USING (is_public = true);
