GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.settings TO anon;
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT ON public.profiles TO anon;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Public projects are viewable by everyone') THEN
    CREATE POLICY "Public projects are viewable by everyone" ON public.projects FOR SELECT TO anon USING (is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Settings are viewable by everyone') THEN
    CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_content' AND policyname = 'Site content is viewable by everyone') THEN
    CREATE POLICY "Site content is viewable by everyone" ON public.site_content FOR SELECT TO anon USING (true);
  END IF;
END $$;