
-- Add portfolio-related columns to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Create unique index on slug (only for non-null slugs)
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON public.projects (slug) WHERE slug IS NOT NULL;

-- Update portfolio_gallery to also reference projects
ALTER TABLE public.portfolio_gallery
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Allow public to view portfolio_gallery for projects
CREATE POLICY "Public can view gallery of projects"
  ON public.portfolio_gallery FOR SELECT
  USING (project_id IS NOT NULL);
