
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('project-files', 'project-files', false, 209715200, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('portfolio', 'portfolio', true, 10485760, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for project-files bucket
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users with project access can read project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete project files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND public.has_role(auth.uid(), 'ADMIN'::app_role)
);

-- Portfolio bucket policies (public read)
CREATE POLICY "Public can read portfolio"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

CREATE POLICY "Admins can upload portfolio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio'
  AND public.has_role(auth.uid(), 'ADMIN'::app_role)
);

CREATE POLICY "Admins can delete portfolio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio'
  AND public.has_role(auth.uid(), 'ADMIN'::app_role)
);

-- Avatar bucket policies
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- file_assets table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.file_assets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploader_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  category       text NOT NULL DEFAULT 'other',
  original_name  text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'project-files',
  storage_path   text NOT NULL,
  mime_type      text,
  extension      text,
  size_bytes     bigint NOT NULL DEFAULT 0,
  version        int NOT NULL DEFAULT 1,
  is_deleted     boolean NOT NULL DEFAULT false,
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_assets_project_created ON public.file_assets(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_assets_project_category ON public.file_assets(project_id, category);
CREATE INDEX IF NOT EXISTS idx_file_assets_uploader ON public.file_assets(uploader_id);

-- Trigger for category validation
CREATE OR REPLACE FUNCTION public.validate_file_category()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.category NOT IN ('site_photos','drawings','references','contracts','deliverables','other') THEN
    RAISE EXCEPTION 'Invalid file category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_file_category_trigger ON public.file_assets;
CREATE TRIGGER validate_file_category_trigger
  BEFORE INSERT OR UPDATE ON public.file_assets
  FOR EACH ROW EXECUTE FUNCTION public.validate_file_category();

-- Enable RLS
ALTER TABLE public.file_assets ENABLE ROW LEVEL SECURITY;

-- Helper: user has access to a project (admin | client owner | staff member)
CREATE OR REPLACE FUNCTION public.user_has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user_id, 'ADMIN'::app_role)
    OR public.is_project_client(_user_id, _project_id)
    OR public.is_project_member(_user_id, _project_id);
$$;

-- RLS Policies on file_assets
CREATE POLICY "Users with project access can view files"
ON public.file_assets FOR SELECT
USING (
  is_deleted = false
  AND public.user_has_project_access(auth.uid(), project_id)
);

CREATE POLICY "Users with project access can upload files"
ON public.file_assets FOR INSERT
WITH CHECK (
  auth.uid() = uploader_id
  AND public.user_has_project_access(auth.uid(), project_id)
);

CREATE POLICY "Uploaders and admins can soft-delete files"
ON public.file_assets FOR UPDATE
USING (
  auth.uid() = uploader_id
  OR public.has_role(auth.uid(), 'ADMIN'::app_role)
);

CREATE POLICY "Admins can hard-delete files"
ON public.file_assets FOR DELETE
USING (public.has_role(auth.uid(), 'ADMIN'::app_role));
