
-- Switch views to security_invoker so they respect the caller's RLS
ALTER VIEW public.public_settings SET (security_invoker = true);
ALTER VIEW public.public_projects SET (security_invoker = true);
ALTER VIEW public.public_project_files SET (security_invoker = true);

-- SETTINGS: anon can read only safe columns
GRANT SELECT (id, studio_name, logo_url, tagline, address,
              facebook_url, instagram_url, behance_url, created_at)
ON public.settings TO anon;

CREATE POLICY "Anon can read public settings columns"
ON public.settings FOR SELECT
TO anon
USING (true);

-- PROJECTS: anon can read only safe columns, only public rows
GRANT SELECT (id, title, description, status, location, start_date, target_date,
              created_at, updated_at, thumbnail_url, slug, summary, content,
              category, tags, year, is_featured, is_public)
ON public.projects TO anon;

CREATE POLICY "Anon can read public projects (safe columns)"
ON public.projects FOR SELECT
TO anon
USING (is_public = true);

-- FILE_ASSETS: anon can read only safe columns, only files of public projects
GRANT SELECT (id, project_id, category, original_name, mime_type,
              extension, size_bytes, version, sort_order, created_at, is_deleted)
ON public.file_assets TO anon;

CREATE POLICY "Anon can read files of public projects (safe columns)"
ON public.file_assets FOR SELECT
TO anon
USING (
  is_deleted = false
  AND EXISTS (SELECT 1 FROM public.projects p
              WHERE p.id = file_assets.project_id AND p.is_public = true)
);
