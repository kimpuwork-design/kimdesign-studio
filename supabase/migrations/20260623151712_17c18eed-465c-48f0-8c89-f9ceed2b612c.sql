
-- 1) SETTINGS: drop public select, add authenticated select, expose safe view to anon
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.settings;

CREATE POLICY "Authenticated users can read settings"
ON public.settings FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE VIEW public.public_settings AS
SELECT id, studio_name, logo_url, tagline, address,
       facebook_url, instagram_url, behance_url, created_at
FROM public.settings;

GRANT SELECT ON public.public_settings TO anon, authenticated;

-- 2) PROJECTS: drop public select; expose safe view (no client_id)
DROP POLICY IF EXISTS "Public can view public projects" ON public.projects;

CREATE OR REPLACE VIEW public.public_projects AS
SELECT id, title, description, status, location, start_date, target_date,
       created_at, updated_at, thumbnail_url, slug, summary, content,
       category, tags, year, is_featured, is_public
FROM public.projects
WHERE is_public = true;

GRANT SELECT ON public.public_projects TO anon, authenticated;

-- 3) FILE_ASSETS: drop public select; expose safe view (no storage_path/bucket)
DROP POLICY IF EXISTS "Public can view files of public projects" ON public.file_assets;

CREATE OR REPLACE VIEW public.public_project_files AS
SELECT f.id, f.project_id, f.category, f.original_name, f.mime_type,
       f.extension, f.size_bytes, f.version, f.sort_order, f.created_at
FROM public.file_assets f
JOIN public.projects p ON p.id = f.project_id
WHERE f.is_deleted = false AND p.is_public = true;

GRANT SELECT ON public.public_project_files TO anon, authenticated;

-- 4) NOTIFICATIONS: only triggers (security definer) should insert
DROP POLICY IF EXISTS "Authenticated users can insert notifications for themselves" ON public.notifications;
REVOKE INSERT ON public.notifications FROM authenticated, anon;
