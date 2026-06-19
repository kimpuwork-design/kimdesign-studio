
-- 1) audit_logs: remove direct client INSERT; only SECURITY DEFINER triggers / service_role may write
DROP POLICY IF EXISTS "Authenticated users can insert their own audit logs" ON public.audit_logs;
REVOKE INSERT ON public.audit_logs FROM authenticated, anon;

-- 2) file_assets: restrict INSERT to ADMIN/STAFF (clients cannot create file rows)
DROP POLICY IF EXISTS "Users with project access can upload files" ON public.file_assets;
CREATE POLICY "Staff/admin with project access can upload files"
  ON public.file_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = uploader_id
    AND user_has_project_access(auth.uid(), project_id)
    AND (
      public.has_role(auth.uid(), 'ADMIN'::app_role)
      OR public.has_role(auth.uid(), 'STAFF'::app_role)
    )
  );

-- 3) storage.objects: add SELECT policy for private project-files bucket
DROP POLICY IF EXISTS "project-files: project access download" ON storage.objects;
CREATE POLICY "project-files: project access download"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM public.file_assets fa
      WHERE fa.storage_path = storage.objects.name
        AND fa.storage_bucket = 'project-files'
        AND fa.is_deleted = false
        AND public.user_has_project_access(auth.uid(), fa.project_id)
    )
  );

-- 4) Realtime: remove sensitive tables from publication to avoid broadcasting row changes
ALTER PUBLICATION supabase_realtime DROP TABLE public.leads;
ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.invoices;
