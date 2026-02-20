
-- ============================================================
-- STEP 6: PORTFOLIO CMS + SETTINGS EXTENSION
-- ============================================================

-- 1. Extend settings table with social/contact fields
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS behance_url text,
  ADD COLUMN IF NOT EXISTS tagline text;

-- 2. portfolio_items table
CREATE TABLE public.portfolio_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  summary         text NOT NULL,
  content         text,
  cover_image_url text NOT NULL DEFAULT '',
  tags            text[] NOT NULL DEFAULT '{}',
  category        text,
  location        text,
  year            integer,
  is_featured     boolean NOT NULL DEFAULT false,
  is_published    boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_items_published ON public.portfolio_items(is_published, created_at DESC);
CREATE INDEX idx_portfolio_items_featured  ON public.portfolio_items(is_featured) WHERE is_featured = true;
CREATE INDEX idx_portfolio_items_slug      ON public.portfolio_items(slug);

-- Auto-update updated_at
CREATE TRIGGER trg_portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. portfolio_gallery table
CREATE TABLE public.portfolio_gallery (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id   uuid NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  image_url      text NOT NULL,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_gallery ON public.portfolio_gallery(portfolio_id, sort_order);

-- ============================================================
-- RLS: portfolio_items
-- ============================================================
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can insert portfolio items"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can update portfolio items"
  ON public.portfolio_items FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can delete portfolio items"
  ON public.portfolio_items FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- ============================================================
-- RLS: portfolio_gallery
-- ============================================================
ALTER TABLE public.portfolio_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view gallery of published items"
  ON public.portfolio_gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.portfolio_items pi
      WHERE pi.id = portfolio_id AND pi.is_published = true
    )
  );

CREATE POLICY "Admins can view all gallery images"
  ON public.portfolio_gallery FOR SELECT
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can insert gallery images"
  ON public.portfolio_gallery FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can update gallery images"
  ON public.portfolio_gallery FOR UPDATE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admins can delete gallery images"
  ON public.portfolio_gallery FOR DELETE
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- ============================================================
-- Storage: portfolio bucket policies (bucket already exists as public)
-- ============================================================
-- Admin can upload to portfolio bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Admins can upload portfolio images'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Admins can upload portfolio images"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'portfolio'
          AND public.has_role(auth.uid(), 'ADMIN'::app_role)
        )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Admins can update portfolio images'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Admins can update portfolio images"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'portfolio'
          AND public.has_role(auth.uid(), 'ADMIN'::app_role)
        )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'Admins can delete portfolio images'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Admins can delete portfolio images"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'portfolio'
          AND public.has_role(auth.uid(), 'ADMIN'::app_role)
        )
    $p$;
  END IF;
END;
$$;

-- Enable realtime for portfolio_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_items;
