
-- Allow all visitors (including anonymous) to see all projects
DROP POLICY IF EXISTS "Public can view public projects" ON public.projects;

CREATE POLICY "Public can view all projects"
  ON public.projects FOR SELECT
  USING (true);
