-- Add AI-friendly structured content columns to seo_pages
-- This enables AI Overviews extraction and better SERP features

ALTER TABLE public.seo_pages 
ADD COLUMN IF NOT EXISTS ai_definition TEXT,
ADD COLUMN IF NOT EXISTS ai_process_steps JSONB,
ADD COLUMN IF NOT EXISTS ai_cost_range JSONB,
ADD COLUMN IF NOT EXISTS ai_checklist JSONB,
ADD COLUMN IF NOT EXISTS ai_comparison_table JSONB,
ADD COLUMN IF NOT EXISTS ai_structured_data JSONB;

-- Create simple index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seo_pages_ai_content ON seo_pages(ai_definition) WHERE ai_definition IS NOT NULL;

-- Create function to generate structured content from existing content
CREATE OR REPLACE FUNCTION generate_ai_structured_content(treatment_name TEXT, existing_content TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::jsonb;
BEGIN
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments
COMMENT ON COLUMN seo_pages.ai_definition IS '2-3 sentence direct answer to "What is [treatment]?" - optimized for AI extraction';
COMMENT ON COLUMN seo_pages.ai_process_steps IS 'Array of step-by-step process for the treatment - numbered list format';
COMMENT ON COLUMN seo_pages.ai_cost_range IS 'Array of {treatment: string, min_aed: number, max_aed: number, notes: string} - cost breakdown table';
COMMENT ON COLUMN seo_pages.ai_checklist IS 'Array of {criteria: string, applies: boolean, description: string} - "Is it right for me?" checklist';
COMMENT ON COLUMN seo_pages.ai_comparison_table IS 'Array of {feature: string, option1: string, option2: string} - comparison table for treatment options';
COMMENT ON COLUMN seo_pages.ai_structured_data IS 'Complete AI-ready structured content combining all sections';

-- Update dental implants
UPDATE seo_pages 
SET 
  ai_definition = 'Dental implants are titanium posts surgically placed into the jawbone to replace missing tooth roots. They provide a permanent foundation for custom crowns, bridges, or dentures, offering superior stability and natural appearance compared to traditional options. In the UAE, all dental implant procedures must be performed by DHA-licensed oral surgeons or periodontists.',
  ai_process_steps = '[{"step": 1, "title": "Initial Consultation", "description": "Comprehensive exam, X-rays, and treatment planning with your dentist."},{"step": 2, "title": "Treatment Planning", "description": "3D CT scan to assess bone density and determine implant placement."},{"step": 3, "title": "Implant Surgery", "description": "Titanium post placed into jawbone under local anesthesia or sedation."},{"step": 4, "title": "Healing Period", "description": "3-6 months for osseointegration (bone fusion with implant)."},{"step": 5, "title": "Abutment Placement", "description": "Connector piece attached to hold the final restoration."},{"step": 6, "title": "Final Restoration", "description": "Custom crown, bridge, or denture secured to the implant."}]'::jsonb,
  ai_cost_range = '[{"treatment": "Single Dental Implant", "min_aed": 2500, "max_aed": 8000, "notes": "Including crown - varies by clinic and materials"},{"treatment": "Full Arch Implants (All-on-4)", "min_aed": 18000, "max_aed": 35000, "notes": "Per arch - includes temporary teeth"},{"treatment": "Bone Grafting", "min_aed": 800, "max_aed": 3000, "notes": "Required if insufficient bone density"},{"treatment": "Sinus Lift", "min_aed": 1500, "max_aed": 4000, "notes": "For upper jaw implants where bone is insufficient"}]'::jsonb,
  ai_checklist = '[{"criteria": "Missing one or more teeth", "applies": true, "description": "Ideal for single or multiple tooth replacement"},{"criteria": "Adequate bone density", "applies": true, "description": "Bone graft can be done if needed"},{"criteria": "Good oral hygiene", "applies": true, "description": "Must commit to regular brushing and flossing"},{"criteria": "Non-smoker or willing to quit", "applies": true, "description": "Smoking significantly impairs healing"},{"criteria": "No uncontrolled medical conditions", "applies": true, "description": "Diabetes, heart disease must be managed"},{"criteria": "Under 18 years old", "applies": false, "description": "Jaw growth must be complete"}]'::jsonb
WHERE slug = '/services/dental-implants' AND page_type = 'service';

-- Update Invisalign
UPDATE seo_pages 
SET 
  ai_definition = 'Invisalign uses a series of custom-made clear aligner trays to gradually straighten teeth. Each set of aligners is worn for 1-2 weeks, moving teeth incrementally into the desired position. Unlike traditional braces, Invisalign aligners are removable, virtually invisible, and allow normal eating and brushing.',
  ai_process_steps = '[{"step": 1, "title": "Initial Scan", "description": "Digital impressions or 3D scan of your teeth."},{"step": 2, "title": "Treatment Planning", "description": "ClinCheck software shows projected tooth movement."},{"step": 3, "title": "Aligner Fabrication", "description": "Custom aligners made based on your treatment plan."},{"step": 4, "title": "Wear Aligners", "description": "22+ hours daily for 6-18 months depending on complexity."},{"step": 5, "title": "Monitoring", "description": "Regular check-ups every 6-8 weeks to track progress."},{"step": 6, "title": "Retention", "description": "Final retainers to maintain your new smile."}]'::jsonb,
  ai_cost_range = '[{"treatment": "Invisalign Express (Minor)", "min_aed": 8000, "max_aed": 12000, "notes": "For minimal corrections - 7 aligners"},{"treatment": "Invisalign Full", "min_aed": 15000, "max_aed": 28000, "notes": "Most common - unlimited aligners"},{"treatment": "Invisalign Comprehensive", "min_aed": 22000, "max_aed": 35000, "notes": "Complex cases - includes refinements"}]'::jsonb,
  ai_checklist = '[{"criteria": "Mild to moderate misalignment", "applies": true, "description": "Crowding, gaps, or slight rotation"},{"criteria": "Committed to wearing aligners", "applies": true, "description": "22+ hours daily is essential for results"},{"criteria": "Adult or responsible teen", "applies": true, "description": "Teens can use with parental supervision"},{"criteria": "Severe bite issues", "applies": false, "description": "Traditional braces may be better for complex cases"},{"criteria": "Cannot remove aligners regularly", "applies": false, "description": "Compliance is critical for success"}]'::jsonb
WHERE slug = '/services/invisalign' AND page_type = 'service';

-- Update Teeth Whitening
UPDATE seo_pages 
SET 
  ai_definition = 'Teeth whitening is a cosmetic procedure that removes stains and discoloration from tooth enamel using hydrogen peroxide or carbamide peroxide gel. In-clinic treatments use higher concentration gels activated by LED light for faster results, while take-home kits provide gradual whitening over 1-2 weeks.',
  ai_process_steps = '[{"step": 1, "title": "Consultation", "description": "Assess tooth health and determine suitability."},{"step": 2, "title": "Cleaning", "description": "Professional cleaning to remove surface stains and plaque."},{"step": 3, "title": "Protection", "description": "Gum barrier applied to protect soft tissues."},{"step": 4, "title": "Whitening Application", "description": "Professional gel applied to teeth (in-office) or custom trays (take-home)."},{"step": 5, "title": "Activation", "description": "LED light or laser used to accelerate whitening (in-office)."},{"step": 6, "title": "Results & Maintenance", "description": "Immediate results shown, maintenance tips provided."}]'::jsonb,
  ai_cost_range = '[{"treatment": "In-Office Laser Whitening", "min_aed": 800, "max_aed": 2500, "notes": "Single session, immediate results"},{"treatment": "Zoom Whitening", "min_aed": 1000, "max_aed": 3000, "notes": "Premium in-office system"},{"treatment": "Take-Home Kit (Professional)", "min_aed": 600, "max_aed": 1200, "notes": "Custom trays + whitening gel"},{"treatment": "Internal Bleaching (per tooth)", "min_aed": 300, "max_aed": 600, "notes": "For root-treated teeth"}]'::jsonb,
  ai_checklist = '[{"criteria": "Healthy natural teeth", "applies": true, "description": "No crowns or veneers on front teeth"},{"criteria": "Non-smoker", "applies": true, "description": "Smoking quickly reverses results"},{"criteria": "No sensitive teeth", "applies": true, "description": "Can worsen sensitivity"},{"criteria": "Not pregnant or breastfeeding", "applies": false, "description": "Safety not established"},{"criteria": "Under 16 years old", "applies": false, "description": "Enamel not fully developed"}]'::jsonb
WHERE slug = '/services/teeth-whitening' AND page_type = 'service';

-- Create view for content managers
CREATE OR REPLACE VIEW seo_pages_ai_ready AS
SELECT 
  slug,
  page_type,
  meta_title,
  meta_description,
  h1,
  ai_definition IS NOT NULL AS has_definition,
  ai_process_steps IS NOT NULL AS has_process,
  ai_cost_range IS NOT NULL AS has_costs,
  ai_checklist IS NOT NULL AS has_checklist,
  ai_comparison_table IS NOT NULL AS has_comparison,
  created_at,
  updated_at
FROM seo_pages
WHERE page_type IN ('service', 'service-location', 'city', 'state');

GRANT SELECT ON seo_pages_ai_ready TO anon, authenticated;
