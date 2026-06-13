
-- Re-scope projects RLS policies so anon visitors only hit the "Public" policy.
DROP POLICY IF EXISTS "Admins see all projects" ON public.projects;
DROP POLICY IF EXISTS "Clients see their own projects" ON public.projects;
DROP POLICY IF EXISTS "Staff see assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "Admins see all projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::public.app_role));

CREATE POLICY "Clients see their own projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'CLIENT'::public.app_role) AND client_id = auth.uid());

CREATE POLICY "Staff see assigned projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'STAFF'::public.app_role) AND public.is_project_member(auth.uid(), id));

CREATE POLICY "Admins can insert projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'::public.app_role));

CREATE POLICY "Admins can update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::public.app_role));

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::public.app_role));
