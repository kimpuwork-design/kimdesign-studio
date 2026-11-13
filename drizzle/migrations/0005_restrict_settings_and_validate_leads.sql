DROP POLICY IF EXISTS "Anon can read public settings columns" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.settings;
CREATE POLICY "Admins can read settings" ON public.settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE OR REPLACE VIEW public.settings_public AS
  SELECT id, studio_name, logo_url, tagline, address, facebook_url, instagram_url, behance_url,
         created_at, hero_portrait_url, hero_role, hero_status, cv_url
  FROM public.settings;
GRANT SELECT ON public.settings_public TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a valid lead" ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND char_length(btrim(name)) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR char_length(phone) <= 30)
    AND char_length(btrim(message)) BETWEEN 1 AND 5000
  );