
-- ============================================================
-- 1) FIX PRIVILEGE ESCALATION: Prevent users from changing their own role
-- ============================================================
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = id) OR has_role(auth.uid(), 'ADMIN'::app_role)
)
WITH CHECK (
  CASE
    -- Admins can change anything
    WHEN has_role(auth.uid(), 'ADMIN'::app_role) THEN true
    -- Non-admins can only update their own row AND cannot change their role
    WHEN auth.uid() = id THEN
      role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    ELSE false
  END
);

-- ============================================================
-- 2) FIX CROSS-TENANT DATA EXPOSURE: Clients only see own projects
-- ============================================================
DROP POLICY IF EXISTS "Clients see all projects" ON public.projects;

CREATE POLICY "Clients see their own projects"
ON public.projects
FOR SELECT
USING (
  has_role(auth.uid(), 'CLIENT'::app_role) AND client_id = auth.uid()
);

-- ============================================================
-- 3) FIX GALLERY IMAGES FROM PRIVATE PROJECTS PUBLICLY VISIBLE
-- ============================================================
DROP POLICY IF EXISTS "Public can view gallery of projects" ON public.portfolio_gallery;

CREATE POLICY "Public can view gallery of public projects"
ON public.portfolio_gallery
FOR SELECT
USING (
  project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = portfolio_gallery.project_id AND p.is_public = true
  )
);
