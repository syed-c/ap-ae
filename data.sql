-- AppointPanda Seed Data
-- UAE Dental Marketplace
-- Run this AFTER all schema migrations

BEGIN;

-- ============================================
-- UAE Emirates (States)
-- ============================================
INSERT INTO public.states (name, slug, abbreviation, country_code, display_order, is_active) VALUES
  ('Dubai', 'dubai', 'DXB', 'AE', 1, true),
  ('Abu Dhabi', 'abu-dhabi', 'AUH', 'AE', 2, true),
  ('Sharjah', 'sharjah', 'SHJ', 'AE', 3, true),
  ('Ajman', 'ajman', 'AJM', 'AE', 4, true),
  ('Ras Al Khaimah', 'ras-al-khaimah', 'RAK', 'AE', 5, true),
  ('Fujairah', 'fujairah', 'FJR', 'AE', 6, true),
  ('Umm Al Quwain', 'umm-al-quwain', 'UAQ', 'AE', 7, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Major UAE Cities
-- ============================================
-- Dubai
INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Dubai', 'dubai', id, 'UAE', true, 3600000 FROM public.states WHERE slug = 'dubai'
ON CONFLICT (slug, state_id) DO NOTHING;

INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Jumeirah', 'jumeirah', id, 'UAE', true, 250000 FROM public.states WHERE slug = 'dubai'
ON CONFLICT (slug, state_id) DO NOTHING;

INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Deira', 'deira', id, 'UAE', true, 300000 FROM public.states WHERE slug = 'dubai'
ON CONFLICT (slug, state_id) DO NOTHING;

INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Bur Dubai', 'bur-dubai', id, 'UAE', true, 500000 FROM public.states WHERE slug = 'dubai'
ON CONFLICT (slug, state_id) DO NOTHING;

INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Dubai Marina', 'dubai-marina', id, 'UAE', true, 200000 FROM public.states WHERE slug = 'dubai'
ON CONFLICT (slug, state_id) DO NOTHING;

-- Abu Dhabi
INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Abu Dhabi City', 'abu-dhabi-city', id, 'UAE', true, 1500000 FROM public.states WHERE slug = 'abu-dhabi'
ON CONFLICT (slug, state_id) DO NOTHING;

INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Al Ain', 'al-ain', id, 'UAE', true, 766000 FROM public.states WHERE slug = 'abu-dhabi'
ON CONFLICT (slug, state_id) DO NOTHING;

-- Sharjah
INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Sharjah City', 'sharjah-city', id, 'UAE', true, 1400000 FROM public.states WHERE slug = 'sharjah'
ON CONFLICT (slug, state_id) DO NOTHING;

INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Khor Fakkan', 'khor-fakkan', id, 'UAE', true, 40000 FROM public.states WHERE slug = 'sharjah'
ON CONFLICT (slug, state_id) DO NOTHING;

-- Ajman
INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Ajman City', 'ajman-city', id, 'UAE', true, 490000 FROM public.states WHERE slug = 'ajman'
ON CONFLICT (slug, state_id) DO NOTHING;

-- Ras Al Khaimah
INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Ras Al Khaimah City', 'ras-al-khaimah-city', id, 'UAE', true, 400000 FROM public.states WHERE slug = 'ras-al-khaimah'
ON CONFLICT (slug, state_id) DO NOTHING;

-- Fujairah
INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Fujairah City', 'fujairah-city', id, 'UAE', true, 225000 FROM public.states WHERE slug = 'fujairah'
ON CONFLICT (slug, state_id) DO NOTHING;

-- Umm Al Quwain
INSERT INTO public.cities (name, slug, state_id, country, is_active, population)
SELECT 'Umm Al Quwain City', 'umm-al-quwain-city', id, 'UAE', true, 60000 FROM public.states WHERE slug = 'umm-al-quwain'
ON CONFLICT (slug, state_id) DO NOTHING;

-- ============================================
-- Dental Treatments
-- ============================================
INSERT INTO public.treatments (name, slug, description, display_order, is_active) VALUES
  ('Teeth Cleaning', 'teeth-cleaning', 'Professional dental cleaning to remove plaque and tartar buildup', 1, true),
  ('Teeth Whitening', 'teeth-whitening', 'Professional teeth whitening for a brighter smile', 2, true),
  ('Dental Implants', 'dental-implants', 'Permanent tooth replacement with titanium implants', 3, true),
  ('Root Canal', 'root-canal', 'Treatment to save infected or damaged teeth', 4, true),
  ('Braces', 'braces', 'Traditional metal braces for teeth straightening', 5, true),
  ('Invisalign', 'invisalign', 'Clear aligners for discreet teeth straightening', 6, true),
  ('Veneers', 'veneers', 'Porcelain veneers for smile makeovers', 7, true),
  ('Emergency Dentist', 'emergency-dentist', '24/7 emergency dental care', 8, true),
  ('Pediatric Dentistry', 'pediatric-dentistry', 'Child-friendly dental care', 9, true),
  ('Wisdom Tooth Removal', 'wisdom-tooth-removal', 'Surgical extraction of wisdom teeth', 10, true),
  ('Dental Crowns', 'dental-crowns', 'Custom caps to restore damaged teeth', 11, true),
  ('Dental Bridges', 'dental-bridges', 'Fixed partial dentures to replace missing teeth', 12, true),
  ('Dentures', 'dentures', 'Removable replacements for missing teeth', 13, true),
  ('Gum Treatment', 'gum-treatment', 'Periodontal treatment for gum disease', 14, true),
  ('Dental Fillings', 'dental-fillings', 'Tooth-colored fillings for cavities', 15, true),
  ('Smile Makeover', 'smile-makeover', 'Comprehensive smile transformation', 16, true),
  ('Dental X-Ray', 'dental-x-ray', 'Digital dental imaging and diagnostics', 17, true),
  ('Tooth Extraction', 'tooth-extraction', 'Simple and surgical tooth removal', 18, true),
  ('TMJ Treatment', 'jaw-treatment-tmj', 'Treatment for jaw pain and TMJ disorders', 19, true),
  ('Dental Check-up', 'dental-check-up', 'Comprehensive dental examination', 20, true),
  ('Hollywood Smile', 'hollywood-smile', 'Premium smile makeover with veneers and crowns', 21, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Insurance Companies (UAE)
-- ============================================
INSERT INTO public.insurances (name, display_order, is_active) VALUES
  ('Allianz Care', 1, true),
  ('AXA Gulf', 2, true),
  ('Cigna International', 3, true),
  ('MSH International', 4, true),
  ('Nextcare', 5, true),
  ('Orient Insurance', 6, true),
  ('Sukoon (Oman Insurance)', 7, true),
  ('Abu Dhabi National Insurance Company (ADNIC)', 8, true),
  ('Al Ain Ahlia Insurance', 9, true),
  ('Dubai Insurance Company', 10, true),
  ('Ras Al Khaimah National Insurance', 11, true),
  ('National General Insurance', 12, true),
  ('Al Buhaira National Insurance', 13, true),
  ('Union Insurance Company', 14, true),
  ('MetLife UAE', 15, true),
  ('Aetna International', 16, true),
  ('Bupa Global', 17, true),
  ('Now Health International', 18, true),
  ('GIG Gulf', 19, true),
  ('Saico', 20, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Subscription Plans
-- ============================================
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, features, display_order, is_active) VALUES
  ('Free', 'free', 'Basic listing for dental clinics', 0, 0, 
   '["Basic clinic profile", "Up to 5 service listings", "Patient reviews", "Basic analytics"]'::jsonb, 1, true),
  ('Pro', 'pro', 'Enhanced visibility and lead generation', 299, 2990, 
   '["Featured clinic profile", "Unlimited service listings", "Priority in search results", "Advanced analytics dashboard", "WhatsApp booking integration", "24/7 support"]'::jsonb, 2, true),
  ('Premium', 'premium', 'Maximum exposure and growth tools', 599, 5990, 
   '["Top placement in search results", "Verified badge", "Dedicated account manager", "Multi-location support", "Custom landing page", "SEO optimization", "Google My Business integration", "API access"]'::jsonb, 3, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Budget Ranges (AED)
-- ============================================
INSERT INTO public.budget_ranges (label, min_value, max_value, currency, display_order, is_active) VALUES
  ('Under 200 AED', 0, 200, 'AED', 1, true),
  ('200 - 400 AED', 200, 400, 'AED', 2, true),
  ('400 - 600 AED', 400, 600, 'AED', 3, true),
  ('600 - 800 AED', 600, 800, 'AED', 4, true),
  ('800 - 1,000 AED', 800, 1000, 'AED', 5, true),
  ('1,000 - 1,500 AED', 1000, 1500, 'AED', 6, true),
  ('1,500 - 2,500 AED', 1500, 2500, 'AED', 7, true),
  ('2,500 - 5,000 AED', 2500, 5000, 'AED', 8, true),
  ('5,000 - 10,000 AED', 5000, 10000, 'AED', 9, true),
  ('10,000+ AED', 10000, NULL, 'AED', 10, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Global Settings
-- ============================================
INSERT INTO public.global_settings (key, value, description) VALUES
  ('platform_name', '"AppointPanda"', 'Platform display name'),
  ('platform_url', '"https://www.appointpanda.ae"', 'Production URL'),
  ('platform_currency', '"AED"', 'Default currency'),
  ('platform_country', '"UAE"', 'Default country'),
  ('default_timezone', '"Asia/Dubai"', 'Default timezone'),
  ('support_email', '"support@appointpanda.ae"', 'Customer support email'),
  ('support_phone', '"800-PANDA"', 'Customer support phone'),
  ('booking_min_advance_hours', '24', 'Minimum hours in advance for booking'),
  ('booking_max_advance_days', '30', 'Maximum days in advance for booking'),
  ('default_slot_duration', '30', 'Default appointment slot duration in minutes'),
  ('max_clinics_per_page', '50', 'Maximum clinics displayed per page')
ON CONFLICT (key) DO NOTHING;

COMMIT;
