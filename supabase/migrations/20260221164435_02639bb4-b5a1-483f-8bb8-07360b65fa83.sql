
-- ============================================================
-- SECURE STORAGE MIGRATION: project-files bucket
-- Purpose: Make project-files PRIVATE, drop all public/anon
-- read policies, enforce strict RLS with file_assets mapping.
-- Portfolio bucket is NOT touched.
-- ============================================================

-- 1) Make project-files bucket PRIVATE
UPDATE storage.buckets
SET public = false
WHERE id = 'project-files';

-- 2) DROP all existing storage policies for project-files
-- (neutralizes any prior buggy migrations)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND qual::text LIKE '%project-files%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END;
$$;

-- 3) STRICT RLS policies for storage.objects on bucket project-files
-- NO SELECT policy at all → nobody can read objects directly (not anon, not authenticated)

-- 3a) INSERT: Only admin/staff with project access via file_assets mapping
CREATE POLICY "project-files: staff/admin insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'STAFF')
    )
  )
  AND (
    EXISTS (
      SELECT 1 FROM public.file_assets fa
      WHERE fa.storage_path = name
        AND fa.storage_bucket = 'project-files'
        AND public.user_has_project_access(auth.uid(), fa.project_id)
    )
    -- Also allow if no file_assets row yet (upload in progress, row created after)
    OR NOT EXISTS (
      SELECT 1 FROM public.file_assets fa
      WHERE fa.storage_path = name
        AND fa.storage_bucket = 'project-files'
    )
  )
);

-- 3b) UPDATE: Only admin/staff with project access, must map to file_assets
CREATE POLICY "project-files: staff/admin update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'STAFF')
  )
  AND EXISTS (
    SELECT 1 FROM public.file_assets fa
    WHERE fa.storage_path = name
      AND fa.storage_bucket = 'project-files'
      AND public.user_has_project_access(auth.uid(), fa.project_id)
  )
);

-- 3c) DELETE: Only admin/staff with project access, must map to file_assets
CREATE POLICY "project-files: staff/admin delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'STAFF')
  )
  AND EXISTS (
    SELECT 1 FROM public.file_assets fa
    WHERE fa.storage_path = name
      AND fa.storage_bucket = 'project-files'
      AND public.user_has_project_access(auth.uid(), fa.project_id)
  )
);

-- 4) Portfolio bucket remains unchanged (public=true, existing policies intact)
