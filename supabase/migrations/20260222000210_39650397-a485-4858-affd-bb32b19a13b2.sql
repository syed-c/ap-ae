
-- Add missing columns that the optimize-meta edge function expects
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS last_meta_edit_source text;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS is_optimized boolean DEFAULT false;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS optimized_at timestamptz;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS needs_optimization boolean DEFAULT true;
