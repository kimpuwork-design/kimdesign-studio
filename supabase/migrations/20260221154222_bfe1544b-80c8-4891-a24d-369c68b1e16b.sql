
-- Make project-files bucket public so anonymous users can view files
UPDATE storage.buckets SET public = true WHERE id = 'project-files';

-- Allow public read access to project-files objects
CREATE POLICY "Public can read project files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'project-files');
