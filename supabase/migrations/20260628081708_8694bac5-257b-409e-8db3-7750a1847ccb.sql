ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS hero_portrait_url text,
  ADD COLUMN IF NOT EXISTS hero_role text,
  ADD COLUMN IF NOT EXISTS hero_status text,
  ADD COLUMN IF NOT EXISTS cv_url text;