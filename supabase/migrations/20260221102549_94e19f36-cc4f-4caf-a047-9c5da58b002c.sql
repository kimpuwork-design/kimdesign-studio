-- Allow public (anonymous) SELECT on projects
CREATE POLICY "Public can view all projects"
ON public.projects
FOR SELECT
USING (true);

-- Allow public SELECT on non-deleted file_assets
CREATE POLICY "Public can view project files"
ON public.file_assets
FOR SELECT
USING (is_deleted = false);
