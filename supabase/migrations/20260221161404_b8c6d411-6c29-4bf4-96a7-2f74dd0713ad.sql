
-- Drop and recreate the UPDATE policy as PERMISSIVE (default)
DROP POLICY IF EXISTS "Uploaders and admins can soft-delete files" ON public.file_assets;

CREATE POLICY "Uploaders and admins can soft-delete files"
ON public.file_assets
FOR UPDATE
TO authenticated
USING ((auth.uid() = uploader_id) OR has_role(auth.uid(), 'ADMIN'::app_role))
WITH CHECK ((auth.uid() = uploader_id) OR has_role(auth.uid(), 'ADMIN'::app_role));
