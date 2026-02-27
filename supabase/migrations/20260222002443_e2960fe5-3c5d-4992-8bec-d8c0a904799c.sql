
-- =============================================
-- PRICE INTELLIGENCE SYSTEM - Database Schema
-- =============================================

-- 1) Service Price Ranges per Emirate (market-level data)
CREATE TABLE public.service_price_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  price_min NUMERIC(10,2) NOT NULL,
  price_max NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  avg_price NUMERIC(10,2),
  source TEXT DEFAULT 'market_research',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(treatment_id, state_id)
);

ALTER TABLE public.service_price_ranges ENABLE ROW LEVEL SECURITY;

-- Public read access (patients need to see prices)
CREATE POLICY "Anyone can view service price ranges"
  ON public.service_price_ranges FOR SELECT
  USING (true);

-- Only super_admins can manage
CREATE POLICY "Super admins can manage price ranges"
  ON public.service_price_ranges FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_service_price_ranges_updated_at
  BEFORE UPDATE ON public.service_price_ranges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Clinic-level price overrides (optional per clinic)
ALTER TABLE public.clinic_treatments
  ADD COLUMN IF NOT EXISTS price_from NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_to NUMERIC(10,2);

-- 3) Insurance Coverage per Service
CREATE TABLE public.insurance_service_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_id UUID NOT NULL REFERENCES public.insurances(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  coverage_percentage INTEGER CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  coverage_notes TEXT,
  is_covered BOOLEAN DEFAULT true,
  max_claim_aed NUMERIC(10,2),
  waiting_period_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(insurance_id, treatment_id)
);

ALTER TABLE public.insurance_service_coverage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view insurance coverage"
  ON public.insurance_service_coverage FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage insurance coverage"
  ON public.insurance_service_coverage FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_insurance_service_coverage_updated_at
  BEFORE UPDATE ON public.insurance_service_coverage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Populate budget_ranges table with smart increments
INSERT INTO public.budget_ranges (label, min_value, max_value, currency, display_order, is_active) VALUES
  ('Under 200 AED', 0, 200, 'AED', 1, true),
  ('200 – 400 AED', 200, 400, 'AED', 2, true),
  ('400 – 600 AED', 400, 600, 'AED', 3, true),
  ('600 – 800 AED', 600, 800, 'AED', 4, true),
  ('800 – 1,000 AED', 800, 1000, 'AED', 5, true),
  ('1,000 – 1,500 AED', 1000, 1500, 'AED', 6, true),
  ('1,500 – 2,500 AED', 1500, 2500, 'AED', 7, true),
  ('2,500 – 5,000 AED', 2500, 5000, 'AED', 8, true),
  ('5,000 – 10,000 AED', 5000, 10000, 'AED', 9, true),
  ('10,000+ AED', 10000, null, 'AED', 10, true)
ON CONFLICT DO NOTHING;

-- 5) Comparison page tracking
CREATE TABLE public.comparison_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('service_price_uae', 'emirate_comparison', 'city_comparison', 'clinic_comparison')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  content TEXT,
  treatment_id UUID REFERENCES public.treatments(id),
  state_id_1 UUID REFERENCES public.states(id),
  state_id_2 UUID REFERENCES public.states(id),
  city_id_1 UUID REFERENCES public.cities(id),
  city_id_2 UUID REFERENCES public.cities(id),
  is_published BOOLEAN DEFAULT true,
  is_indexed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comparison_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comparison pages"
  ON public.comparison_pages FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage comparison pages"
  ON public.comparison_pages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_comparison_pages_updated_at
  BEFORE UPDATE ON public.comparison_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Seed market price ranges for all 21 services across 7 Emirates
-- Dubai prices (premium market)
INSERT INTO public.service_price_ranges (treatment_id, state_id, price_min, price_max, avg_price, source)
SELECT t.id, s.id,
  CASE t.slug
    WHEN 'teeth-cleaning' THEN 150 WHEN 'teeth-whitening' THEN 400 WHEN 'dental-implants' THEN 3500
    WHEN 'root-canal' THEN 800 WHEN 'braces' THEN 3000 WHEN 'invisalign' THEN 5000
    WHEN 'veneers' THEN 800 WHEN 'emergency-dentist' THEN 200 WHEN 'pediatric-dentistry' THEN 150
    WHEN 'wisdom-tooth-removal' THEN 500 WHEN 'dental-crowns' THEN 600 WHEN 'dental-bridges' THEN 1000
    WHEN 'dentures' THEN 1500 WHEN 'gum-treatment' THEN 300 WHEN 'dental-fillings' THEN 150
    WHEN 'smile-makeover' THEN 5000 WHEN 'dental-x-ray' THEN 100 WHEN 'tooth-extraction' THEN 200
    WHEN 'jaw-treatment-tmj' THEN 500 WHEN 'dental-check-up' THEN 100 WHEN 'hollywood-smile' THEN 3000
    ELSE 200
  END,
  CASE t.slug
    WHEN 'teeth-cleaning' THEN 500 WHEN 'teeth-whitening' THEN 1200 WHEN 'dental-implants' THEN 12000
    WHEN 'root-canal' THEN 2500 WHEN 'braces' THEN 10000 WHEN 'invisalign' THEN 15000
    WHEN 'veneers' THEN 2500 WHEN 'emergency-dentist' THEN 800 WHEN 'pediatric-dentistry' THEN 500
    WHEN 'wisdom-tooth-removal' THEN 2000 WHEN 'dental-crowns' THEN 2500 WHEN 'dental-bridges' THEN 4000
    WHEN 'dentures' THEN 6000 WHEN 'gum-treatment' THEN 1500 WHEN 'dental-fillings' THEN 500
    WHEN 'smile-makeover' THEN 25000 WHEN 'dental-x-ray' THEN 400 WHEN 'tooth-extraction' THEN 800
    WHEN 'jaw-treatment-tmj' THEN 2000 WHEN 'dental-check-up' THEN 400 WHEN 'hollywood-smile' THEN 15000
    ELSE 800
  END,
  NULL,
  'market_research'
FROM treatments t, states s
WHERE t.is_active = true AND s.slug = 'dubai';

-- Abu Dhabi prices (~95% of Dubai)
INSERT INTO public.service_price_ranges (treatment_id, state_id, price_min, price_max, avg_price, source)
SELECT t.id, s.id,
  ROUND((SELECT spr.price_min FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.93),
  ROUND((SELECT spr.price_max FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.95),
  NULL, 'market_research'
FROM treatments t, states s
WHERE t.is_active = true AND s.slug = 'abu-dhabi';

-- Sharjah prices (~80% of Dubai)
INSERT INTO public.service_price_ranges (treatment_id, state_id, price_min, price_max, avg_price, source)
SELECT t.id, s.id,
  ROUND((SELECT spr.price_min FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.78),
  ROUND((SELECT spr.price_max FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.82),
  NULL, 'market_research'
FROM treatments t, states s
WHERE t.is_active = true AND s.slug = 'sharjah';

-- Ajman prices (~72% of Dubai)
INSERT INTO public.service_price_ranges (treatment_id, state_id, price_min, price_max, avg_price, source)
SELECT t.id, s.id,
  ROUND((SELECT spr.price_min FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.70),
  ROUND((SELECT spr.price_max FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.75),
  NULL, 'market_research'
FROM treatments t, states s
WHERE t.is_active = true AND s.slug = 'ajman';

-- RAK prices (~70% of Dubai)
INSERT INTO public.service_price_ranges (treatment_id, state_id, price_min, price_max, avg_price, source)
SELECT t.id, s.id,
  ROUND((SELECT spr.price_min FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.68),
  ROUND((SELECT spr.price_max FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.72),
  NULL, 'market_research'
FROM treatments t, states s
WHERE t.is_active = true AND s.slug = 'ras-al-khaimah';

-- Fujairah prices (~68% of Dubai)
INSERT INTO public.service_price_ranges (treatment_id, state_id, price_min, price_max, avg_price, source)
SELECT t.id, s.id,
  ROUND((SELECT spr.price_min FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.65),
  ROUND((SELECT spr.price_max FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.70),
  NULL, 'market_research'
FROM treatments t, states s
WHERE t.is_active = true AND s.slug = 'fujairah';

-- UAQ prices (~65% of Dubai)
INSERT INTO public.service_price_ranges (treatment_id, state_id, price_min, price_max, avg_price, source)
SELECT t.id, s.id,
  ROUND((SELECT spr.price_min FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.63),
  ROUND((SELECT spr.price_max FROM service_price_ranges spr JOIN states ds ON spr.state_id = ds.id WHERE ds.slug = 'dubai' AND spr.treatment_id = t.id) * 0.68),
  NULL, 'market_research'
FROM treatments t, states s
WHERE t.is_active = true AND s.slug = 'umm-al-quwain';
