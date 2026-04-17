-- ============================================================
-- COMPLETE SCHEMA FOR SERVICE-LOCATION PAGES - ALL SECTIONS
-- ============================================================
-- This migration adds ALL columns needed for service-location pages
-- Based on the sections in ServiceLocationPage.tsx

-- ============================================================
-- EXISTING COLUMNS (already in seo_pages table)
-- ============================================================
-- price_min, price_max, price_note, price_currency, price_last_updated
-- treatment_options (JSONB)
-- process_steps (JSONB)
-- benefits (JSONB)
-- candidates (JSONB)
-- alternatives (JSONB)
-- faqs (JSONB)
-- quick_answer
-- last_reviewed_by, last_reviewed_date
-- medical_accuracy_verified, expert_credential
-- process_time_months, process_time_note
-- related_questions (JSONB)
-- content, page_intro, h1, meta_title, meta_description
-- title

-- ============================================================
-- NEW COLUMNS FOR SERVICE-LOCATION SECTIONS
-- ============================================================

-- ---- SECTION 1: TRANSPARENT CARE COSTS ----
-- Title and subtitle for costs section
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS costs_section_title TEXT NULL DEFAULT 'Transparent Care Costs';
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS costs_section_subtitle TEXT NULL DEFAULT 'Quality dental care shouldn''t be a mystery. We provide estimated costs based on market standards.';

-- Individual cost items (for cost cards display)
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_checkup_min INTEGER NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_checkup_max INTEGER NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_checkup_name TEXT NULL DEFAULT 'Check-up';
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_treatment_min INTEGER NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_treatment_max INTEGER NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_polishing_min INTEGER NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_polishing_max INTEGER NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_consultation_min INTEGER NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS cost_consultation_max INTEGER NULL;

-- ---- SECTION 2: THE CONCIERGE JOURNEY ----
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS journey_section_title TEXT NULL DEFAULT 'The Concierge Journey';
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS journey_section_subtitle TEXT NULL DEFAULT 'Three simple steps to your new smile.';

-- ---- SECTION 3: PRECISION IN THE HEART OF [CITY] ----
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS precision_section_title TEXT NULL DEFAULT 'Precision in the Heart of [CITY]';
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS precision_section_subtitle TEXT NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS area_narrative TEXT NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS precision_content_text TEXT NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS trust_heading TEXT NULL DEFAULT 'Content You Can Trust';
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS trust_description TEXT NULL;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS need_quote_heading TEXT NULL DEFAULT 'Need a Quote?';
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS need_quote_description TEXT NULL;

-- ---- SECTION 4: RECOMMENDED FOR ----
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS recommended_section_title TEXT NULL DEFAULT 'Recommended For';

-- ---- SECTION 5: MAY NOT BE SUITABLE ----
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS not_suitable_section_title TEXT NULL DEFAULT 'May Not Be Suitable';

-- ---- SECTION 6: QUICK ANSWER / FEATURED SNIPPET ----
-- (already exists: quick_answer)

-- ---- SECTION 7: EXPERT VERIFICATION ----
-- (already exists: last_reviewed_by, expert_credential, medical_accuracy_verified)

-- ---- SECTION 8: RELATED QUESTIONS ----
-- (already exists: related_questions)

-- ---- SECTION 9: PROCESS TIME ----
-- (already exists: process_time_months, process_time_note)

-- ---- SECTION 10: TREATMENT OPTIONS ----
-- (already exists: treatment_options)

-- ---- SECTION 11: BENEFITS ----
-- (already exists: benefits)

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_seo_pages_costs_section ON public.seo_pages USING btree (costs_section_title) 
WHERE costs_section_title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_seo_pages_precision_section ON public.seo_pages USING btree (precision_section_title) 
WHERE precision_section_title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_seo_pages_area_narrative ON public.seo_pages USING btree (area_narrative) 
WHERE area_narrative IS NOT NULL;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN public.seo_pages.costs_section_title IS 'Section 1: Title for Transparent Care Costs section';
COMMENT ON COLUMN public.seo_pages.costs_section_subtitle IS 'Section 1: Subtitle/description for costs section';
COMMENT ON COLUMN public.seo_pages.journey_section_title IS 'Section 2: Title for The Concierge Journey section';
COMMENT ON COLUMN public.seo_pages.journey_section_subtitle IS 'Section 2: Subtitle for journey section';
COMMENT ON COLUMN public.seo_pages.precision_section_title IS 'Section 3: Title for Precision section';
COMMENT ON COLUMN public.seo_pages.precision_section_subtitle IS 'Section 3: Subtitle for precision section';
COMMENT ON COLUMN public.seo_pages.area_narrative IS 'Section 3: Narrative text about the area/city';
COMMENT ON COLUMN public.seo_pages.recommended_section_title IS 'Section 4: Title for Recommended For section';
COMMENT ON COLUMN public.seo_pages.not_suitable_section_title IS 'Section 5: Title for May Not Be Suitable section';
