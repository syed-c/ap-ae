-- Add page identity fields to seo_pages
ALTER TABLE public.seo_pages 
  ADD COLUMN IF NOT EXISTS page_intent_type text,
  ADD COLUMN IF NOT EXISTS structure_template integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS identity_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS local_authenticity_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS page_value_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_sounding_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_index_worthy boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS index_block_reason text,
  ADD COLUMN IF NOT EXISTS last_identity_scan_at timestamptz,
  ADD COLUMN IF NOT EXISTS content_fingerprint text,
  ADD COLUMN IF NOT EXISTS meta_fingerprint text,
  ADD COLUMN IF NOT EXISTS structure_fingerprint text,
  ADD COLUMN IF NOT EXISTS boilerplate_cluster_id text,
  ADD COLUMN IF NOT EXISTS rewrite_priority text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS editorial_status text DEFAULT 'pending';

-- Create index for identity scanning
CREATE INDEX IF NOT EXISTS idx_seo_pages_identity_score ON public.seo_pages(identity_score);
CREATE INDEX IF NOT EXISTS idx_seo_pages_page_value_score ON public.seo_pages(page_value_score);
CREATE INDEX IF NOT EXISTS idx_seo_pages_rewrite_priority ON public.seo_pages(rewrite_priority);
CREATE INDEX IF NOT EXISTS idx_seo_pages_boilerplate_cluster ON public.seo_pages(boilerplate_cluster_id);
CREATE INDEX IF NOT EXISTS idx_seo_pages_editorial_status ON public.seo_pages(editorial_status);
CREATE INDEX IF NOT EXISTS idx_seo_pages_is_index_worthy ON public.seo_pages(is_index_worthy);