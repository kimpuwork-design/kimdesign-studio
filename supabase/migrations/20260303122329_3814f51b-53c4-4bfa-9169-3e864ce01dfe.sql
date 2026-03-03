-- Make portfolio_id nullable and drop the FK since portfolio is now merged into projects
ALTER TABLE public.portfolio_gallery ALTER COLUMN portfolio_id DROP NOT NULL;
ALTER TABLE public.portfolio_gallery DROP CONSTRAINT IF EXISTS portfolio_gallery_portfolio_id_fkey;
