
-- 1. Add is_public column to projects (default false for security)
ALTER TABLE public.projects ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- 2. Drop the overly permissive public SELECT policy on projects
DROP POLICY IF EXISTS "Public can view all projects" ON public.projects;

-- 3. Add a narrower public SELECT policy: only projects marked as public, and only safe columns
CREATE POLICY "Public can view public projects"
ON public.projects
FOR SELECT
USING (is_public = true);

-- 4. Drop the overly permissive public SELECT policy on file_assets
DROP POLICY IF EXISTS "Public can view project files" ON public.file_assets;

-- 5. Add narrower public SELECT policy: only files from public projects
CREATE POLICY "Public can view files of public projects"
ON public.file_assets
FOR SELECT
USING (
  is_deleted = false
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = file_assets.project_id AND p.is_public = true
  )
);
