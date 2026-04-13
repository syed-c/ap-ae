-- ============================================
-- Service-Location Page SEO Enhancement
-- Adds new columns for pricing, process, benefits, candidate info
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns to seo_pages table for enhanced service-location pages

-- 1. Price range columns
ALTER TABLE seo_pages 
ADD COLUMN IF NOT EXISTS price_min INTEGER,
ADD COLUMN IF NOT EXISTS price_max INTEGER,
ADD COLUMN IF NOT EXISTS price_currency TEXT DEFAULT 'AED',
ADD COLUMN IF NOT EXISTS price_note TEXT,
ADD COLUMN IF NOT EXISTS price_last_updated DATE;

-- 2. Treatment process columns (for HowTo schema)
ALTER TABLE seo_pages 
ADD COLUMN IF NOT EXISTS process_steps JSONB,
ADD COLUMN IF NOT EXISTS process_time_months TEXT,
ADD COLUMN IF NOT EXISTS process_time_note TEXT;

-- 3. Treatment comparison (JSON for comparison tables)
ALTER TABLE seo_pages 
ADD COLUMN IF NOT EXISTS treatment_options JSONB,
ADD COLUMN IF NOT EXISTS comparison_table JSONB;

-- 4. Benefits and candidate sections
ALTER TABLE seo_pages 
ADD COLUMN IF NOT EXISTS benefits JSONB,
ADD COLUMN IF NOT EXISTS candidates JSONB,
ADD COLUMN IF NOT EXISTS alternatives JSONB;

-- 5. E-E-A-T columns
ALTER TABLE seo_pages 
ADD COLUMN IF NOT EXISTS last_reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS last_reviewed_date DATE,
ADD COLUMN IF NOT EXISTS medical_accuracy_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expert_credential TEXT;

-- 6. AIO optimization columns
ALTER TABLE seo_pages 
ADD COLUMN IF NOT EXISTS quick_answer TEXT,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS related_questions JSONB;

-- 7. Additional SEO enhancements
ALTER TABLE seo_pages 
ADD COLUMN IF NOT EXISTS preparation_tips JSONB,
ADD COLUMN IF NOT EXISTS recovery_info JSONB,
ADD COLUMN IF NOT EXISTS warning_text TEXT;

-- 8. Competitor analysis (for competitor-based content generation)
ALTER TABLE seo_pages 
ADD COLUMN IF NOT EXISTS competitor_analysis JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_seo_pages_price_range ON seo_pages(price_min, price_max) WHERE price_min IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seo_pages_medical_verified ON seo_pages(medical_accuracy_verified) WHERE medical_accuracy_verified = true;
CREATE INDEX IF NOT EXISTS idx_seo_pages_service_location ON seo_pages(slug) WHERE slug ILIKE '%/%/%';

-- Add comments for documentation
COMMENT ON COLUMN seo_pages.price_min IS 'Minimum price for treatment in AED';
COMMENT ON COLUMN seo_pages.price_max IS 'Maximum price for treatment in AED';
COMMENT ON COLUMN seo_pages.process_steps IS 'Array of step objects: {step, title, description, duration}';
COMMENT ON COLUMN seo_pages.treatment_options IS 'Array of treatment type options for comparison: {type, name, description, price_min, price_max, duration, visibility, best_for}';
COMMENT ON COLUMN seo_pages.benefits IS 'Array of benefit objects: {title, description}';
COMMENT ON COLUMN seo_pages.candidates IS 'Array of candidate criteria: {description, conditions}';
COMMENT ON COLUMN seo_pages.quick_answer IS 'Short answer for AI/featured snippets (50-100 words)';
COMMENT ON COLUMN seo_pages.ai_summary IS 'AI-optimized summary for semantic search';
COMMENT ON COLUMN seo_pages.last_reviewed_by IS 'Name of dentist/expert who reviewed content';
COMMENT ON COLUMN seo_pages.medical_accuracy_verified IS 'Content verified by licensed dental professional';
COMMENT ON COLUMN seo_pages.competitor_analysis IS 'Competitor research data: {queries_used, urls_analyzed, findings, generated_at}';

-- ============================================
-- Also update page_content table for CMS
-- ============================================

ALTER TABLE page_content 
ADD COLUMN IF NOT EXISTS price_min INTEGER,
ADD COLUMN IF NOT EXISTS price_max INTEGER,
ADD COLUMN IF NOT EXISTS price_note TEXT,
ADD COLUMN IF NOT EXISTS process_steps JSONB,
ADD COLUMN IF NOT EXISTS treatment_options JSONB,
ADD COLUMN IF NOT EXISTS benefits JSONB,
ADD COLUMN IF NOT EXISTS candidates JSONB,
ADD COLUMN IF NOT EXISTS quick_answer TEXT,
ADD COLUMN IF NOT EXISTS last_reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS medical_accuracy_verified BOOLEAN DEFAULT false;

-- ============================================
-- Enable RLS and create policies
-- ============================================

-- Enable RLS on seo_pages if not already
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (service role can do anything)
DROP POLICY IF EXISTS "Allow all for authenticated" ON seo_pages;
CREATE POLICY "Allow all for authenticated" ON seo_pages 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Same for page_content
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated page_content" ON page_content;
CREATE POLICY "Allow all for authenticated page_content" ON page_content 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- Log completion
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Service-location SEO enhancement columns added successfully!';
  
  -- Show what columns were added
  RAISE NOTICE 'New columns in seo_pages: price_min, price_max, price_currency, price_note, price_last_updated, process_steps, process_time_months, process_time_note, treatment_options, comparison_table, benefits, candidates, alternatives, last_reviewed_by, last_reviewed_date, medical_accuracy_verified, expert_credential, quick_answer, ai_summary, related_questions, preparation_tips, recovery_info, warning_text';
  
  RAISE NOTICE 'New columns in page_content: price_min, price_max, price_note, process_steps, treatment_options, benefits, candidates, quick_answer, last_reviewed_by, medical_accuracy_verified';
END $$;