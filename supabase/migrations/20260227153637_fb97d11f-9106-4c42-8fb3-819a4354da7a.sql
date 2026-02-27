
-- Drop the restrictive client policy and replace with one that lets all clients see all projects
DROP POLICY IF EXISTS "Clients see their own projects" ON public.projects;

CREATE POLICY "Clients see all projects"
  ON public.projects FOR SELECT
  USING (has_role(auth.uid(), 'CLIENT'::app_role));
