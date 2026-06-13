
-- 1) Remove overly-broad project-files INSERT policy (stricter staff/admin policy already exists)
DROP POLICY IF EXISTS "Authenticated users can upload project files" ON storage.objects;

-- 2) Tighten invoice PDF SELECT policy
DROP POLICY IF EXISTS "Project members can download invoice PDFs" ON storage.objects;
CREATE POLICY "Project members can download invoice PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoice-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.pdf_url IS NOT NULL
      AND (i.pdf_url = storage.objects.name OR i.pdf_url LIKE '%' || storage.objects.name)
      AND public.user_has_project_access(auth.uid(), i.project_id)
  )
);

-- 3) Realtime channel authorization
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can subscribe to own/project topics" ON realtime.messages;
CREATE POLICY "Authenticated can subscribe to own/project topics"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  -- own user topic e.g. "user:<uid>" or "notifications:<uid>"
  realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() = ('notifications:' || auth.uid()::text)
  -- project-scoped topics e.g. "project:<uuid>" or "project:<uuid>:messages"
  OR (
    realtime.topic() LIKE 'project:%'
    AND public.user_has_project_access(
      auth.uid(),
      NULLIF(split_part(split_part(realtime.topic(), ':', 2), ':', 1), '')::uuid
    )
  )
  -- admins can subscribe to any channel
  OR public.has_role(auth.uid(), 'ADMIN'::public.app_role)
);

-- 4) Revoke anon EXECUTE on SECURITY DEFINER helper functions; keep authenticated for RLS use
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_project_client(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_project_access(uuid, uuid) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_project_access(uuid, uuid) TO authenticated;

-- generate_invoice_number is server-side only (called from edge functions via service_role)
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM anon, authenticated, PUBLIC;
