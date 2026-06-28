-- 1) SETTINGS: revoke broad anon SELECT, re-grant only safe columns
REVOKE SELECT ON public.settings FROM anon;
REVOKE SELECT ON public.settings FROM PUBLIC;

GRANT SELECT
  (id, studio_name, logo_url, tagline, address,
   facebook_url, instagram_url, behance_url, created_at,
   hero_portrait_url, hero_role, hero_status, cv_url)
ON public.settings TO anon;

-- 2) PROJECTS: revoke broad anon SELECT, re-grant only safe columns
REVOKE SELECT ON public.projects FROM anon;
REVOKE SELECT ON public.projects FROM PUBLIC;

GRANT SELECT
  (id, title, description, status, location, start_date, target_date,
   created_at, updated_at, thumbnail_url, slug, summary, content,
   category, tags, year, is_featured, is_public)
ON public.projects TO anon;

-- 3) AVATARS bucket: allow users to delete their own avatar files
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);