
-- STEP 1: Delete all existing US states and cities data
DELETE FROM public.areas;
DELETE FROM public.cities;
DELETE FROM public.states;

-- STEP 2: Insert UAE as country (upsert)
INSERT INTO public.countries (id, code, name, is_active)
VALUES (gen_random_uuid(), 'AE', 'United Arab Emirates', true)
ON CONFLICT DO NOTHING;

-- STEP 3: Insert all 7 Emirates as "states"
INSERT INTO public.states (id, name, slug, abbreviation, country_code, is_active, display_order, dentist_count, clinic_count) VALUES
  (gen_random_uuid(), 'Dubai', 'dubai', 'DXB', 'AE', true, 1, 0, 0),
  (gen_random_uuid(), 'Abu Dhabi', 'abu-dhabi', 'AUH', 'AE', true, 2, 0, 0),
  (gen_random_uuid(), 'Sharjah', 'sharjah', 'SHJ', 'AE', true, 3, 0, 0),
  (gen_random_uuid(), 'Ajman', 'ajman', 'AJM', 'AE', true, 4, 0, 0),
  (gen_random_uuid(), 'Ras Al Khaimah', 'ras-al-khaimah', 'RAK', 'AE', true, 5, 0, 0),
  (gen_random_uuid(), 'Fujairah', 'fujairah', 'FUJ', 'AE', true, 6, 0, 0),
  (gen_random_uuid(), 'Umm Al Quwain', 'umm-al-quwain', 'UAQ', 'AE', true, 7, 0, 0);

-- STEP 4: Insert Dubai Areas
INSERT INTO public.cities (id, name, slug, state_id, country, is_active, dentist_count) 
SELECT gen_random_uuid(), area_name, area_slug, s.id, 'AE', true, 0
FROM public.states s,
(VALUES
  ('Downtown Dubai', 'downtown-dubai'),
  ('Business Bay', 'business-bay'),
  ('Dubai Marina', 'dubai-marina'),
  ('JBR', 'jbr'),
  ('JLT', 'jlt'),
  ('Palm Jumeirah', 'palm-jumeirah'),
  ('Jumeirah', 'jumeirah'),
  ('Jumeirah Village Circle', 'jvc'),
  ('Jumeirah Village Triangle', 'jvt'),
  ('Umm Suqeim', 'umm-suqeim'),
  ('Al Barsha', 'al-barsha'),
  ('Dubai Silicon Oasis', 'dubai-silicon-oasis'),
  ('International City', 'international-city'),
  ('Deira', 'deira'),
  ('Bur Dubai', 'bur-dubai'),
  ('Karama', 'karama'),
  ('Al Qusais', 'al-qusais'),
  ('Al Nahda Dubai', 'al-nahda-dubai'),
  ('Mirdif', 'mirdif'),
  ('Dubai Hills', 'dubai-hills'),
  ('Arabian Ranches', 'arabian-ranches'),
  ('Al Quoz', 'al-quoz'),
  ('DIFC', 'difc'),
  ('Dubai Investment Park', 'dubai-investment-park'),
  ('Al Rashidiya', 'al-rashidiya'),
  ('Al Warqa', 'al-warqa'),
  ('Discovery Gardens', 'discovery-gardens'),
  ('Dubai Sports City', 'dubai-sports-city'),
  ('Motor City', 'motor-city'),
  ('Al Mamzar', 'al-mamzar'),
  ('Oud Metha', 'oud-metha'),
  ('Healthcare City', 'healthcare-city'),
  ('Al Safa', 'al-safa'),
  ('Jumeirah Beach Residence', 'jumeirah-beach-residence'),
  ('Dubai Festival City', 'dubai-festival-city')
) AS areas(area_name, area_slug)
WHERE s.slug = 'dubai';

-- STEP 5: Insert Sharjah Areas
INSERT INTO public.cities (id, name, slug, state_id, country, is_active, dentist_count) 
SELECT gen_random_uuid(), area_name, area_slug, s.id, 'AE', true, 0
FROM public.states s,
(VALUES
  ('Al Majaz', 'al-majaz'),
  ('Al Nahda Sharjah', 'al-nahda-sharjah'),
  ('Al Qasimia', 'al-qasimia'),
  ('Al Taawun', 'al-taawun'),
  ('Muwaileh', 'muwaileh'),
  ('Rolla', 'rolla'),
  ('Al Khan', 'al-khan'),
  ('Al Jubail', 'al-jubail'),
  ('Al Mamzar Sharjah', 'al-mamzar-sharjah'),
  ('University City', 'university-city'),
  ('Sharjah Industrial Area', 'sharjah-industrial-area'),
  ('Al Gharb', 'al-gharb'),
  ('Bu Daniq', 'bu-daniq'),
  ('Al Wahda', 'al-wahda-sharjah'),
  ('Halwan', 'halwan')
) AS areas(area_name, area_slug)
WHERE s.slug = 'sharjah';

-- STEP 6: Insert Abu Dhabi Areas
INSERT INTO public.cities (id, name, slug, state_id, country, is_active, dentist_count) 
SELECT gen_random_uuid(), area_name, area_slug, s.id, 'AE', true, 0
FROM public.states s,
(VALUES
  ('Khalifa City', 'khalifa-city'),
  ('Al Reem Island', 'al-reem-island'),
  ('Al Khalidiyah', 'al-khalidiyah'),
  ('Corniche', 'corniche'),
  ('Yas Island', 'yas-island'),
  ('Saadiyat Island', 'saadiyat-island'),
  ('Mussafah', 'mussafah'),
  ('Mohamed Bin Zayed City', 'mbz-city'),
  ('Al Ain', 'al-ain')
) AS areas(area_name, area_slug)
WHERE s.slug = 'abu-dhabi';

-- STEP 7: Insert areas for smaller emirates
INSERT INTO public.cities (id, name, slug, state_id, country, is_active, dentist_count) 
SELECT gen_random_uuid(), area_name, area_slug, s.id, 'AE', true, 0
FROM public.states s,
(VALUES ('Ajman City Centre', 'ajman-city-centre'), ('Al Nuaimiya', 'al-nuaimiya'), ('Rashidiya Ajman', 'rashidiya-ajman')) AS areas(area_name, area_slug)
WHERE s.slug = 'ajman';

INSERT INTO public.cities (id, name, slug, state_id, country, is_active, dentist_count) 
SELECT gen_random_uuid(), area_name, area_slug, s.id, 'AE', true, 0
FROM public.states s,
(VALUES ('Al Nakheel', 'al-nakheel-rak'), ('Al Hamra', 'al-hamra'), ('Khuzam', 'khuzam')) AS areas(area_name, area_slug)
WHERE s.slug = 'ras-al-khaimah';

INSERT INTO public.cities (id, name, slug, state_id, country, is_active, dentist_count) 
SELECT gen_random_uuid(), area_name, area_slug, s.id, 'AE', true, 0
FROM public.states s,
(VALUES ('Fujairah City', 'fujairah-city'), ('Dibba Al Fujairah', 'dibba-al-fujairah')) AS areas(area_name, area_slug)
WHERE s.slug = 'fujairah';

INSERT INTO public.cities (id, name, slug, state_id, country, is_active, dentist_count) 
SELECT gen_random_uuid(), area_name, area_slug, s.id, 'AE', true, 0
FROM public.states s,
(VALUES ('UAQ City', 'uaq-city'), ('Al Salamah', 'al-salamah-uaq')) AS areas(area_name, area_slug)
WHERE s.slug = 'umm-al-quwain';

-- STEP 8: Reset existing clinics location to null (needs UAE setup)
UPDATE public.clinics SET city_id = NULL, area_id = NULL WHERE city_id IS NOT NULL;
