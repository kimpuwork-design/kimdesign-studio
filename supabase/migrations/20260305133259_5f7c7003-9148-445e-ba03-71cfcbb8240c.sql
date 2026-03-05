
-- Page views tracking table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_agent text,
  country text,
  session_id text,
  visitor_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can insert page views"
ON public.page_views FOR INSERT
WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view page views"
ON public.page_views FOR SELECT
USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete page views"
ON public.page_views FOR DELETE
USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- Index for fast queries
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views (path);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);
