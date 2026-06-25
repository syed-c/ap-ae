-- ============================================
-- Fix: Extend app_role enum with all 9 roles
-- Fix: Add user_profiles table with cascade deletes
-- Fix: Add cascade delete on user_roles
-- Fix: Add missing tables (clinic_hours, clinic_images, patients, google_reviews)
-- Fix: Add missing indexes
-- ============================================

-- ============================================
-- 1. Extend app_role enum with all platform roles
-- ============================================
-- PostgreSQL doesn't allow ALTER ENUM ADD VALUE within a transaction,
-- but since these run in separate transactions in Supabase migrations, it's fine.

-- First add new roles to the enum (order shouldn't matter for enums)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin' BEFORE 'patient';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_moderator' BEFORE 'patient';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinic_owner' BEFORE 'dentist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'clinic_manager' BEFORE 'dentist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'receptionist' BEFORE 'patient';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'visitor' AFTER 'patient';

-- ============================================
-- 2. Create user_profiles table with cascade delete
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  is_onboarded BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view/edit own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- ============================================
-- 3. Add cascade delete on user_roles
-- ============================================
-- Drop existing FK on user_roles.user_id if it exists, re-add with CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_roles_user_id_fkey'
    AND table_schema = 'public'
    AND table_name = 'user_roles'
  ) THEN
    ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_fkey;
  END IF;
END $$;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- 4. Create missing tables
-- ============================================

-- Patients (extended user info for patient role)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  emergency_contact TEXT,
  medical_notes TEXT,
  allergies TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own record" ON public.patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own record" ON public.patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage patients" ON public.patients
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Clinic Hours (operating hours per clinic)
CREATE TABLE IF NOT EXISTS public.clinic_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, day_of_week)
);

ALTER TABLE public.clinic_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clinic hours" ON public.clinic_hours
  FOR SELECT USING (true);

CREATE POLICY "Clinic admins can manage hours" ON public.clinic_hours
  FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE claimed_by = auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Clinic Images (gallery)
CREATE TABLE IF NOT EXISTS public.clinic_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, image_url)
);

ALTER TABLE public.clinic_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clinic images" ON public.clinic_images
  FOR SELECT USING (true);

CREATE POLICY "Clinic admins can manage images" ON public.clinic_images
  FOR ALL USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE claimed_by = auth.uid())
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Google Reviews (imported from GMB)
CREATE TABLE IF NOT EXISTS public.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMPTZ,
  google_review_id TEXT UNIQUE,
  is_synced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view google reviews" ON public.google_reviews
  FOR SELECT USING (true);

-- Global Settings
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view global settings" ON public.global_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage global settings" ON public.global_settings
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Budget Ranges (if not already created in a previous migration)
CREATE TABLE IF NOT EXISTS public.budget_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  min_value NUMERIC(10,2),
  max_value NUMERIC(10,2),
  currency TEXT DEFAULT 'AED',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.budget_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view budget ranges" ON public.budget_ranges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage budget ranges" ON public.budget_ranges
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- ============================================
-- 5. Update country defaults for UAE
-- ============================================
ALTER TABLE public.states
  ALTER COLUMN country_code SET DEFAULT 'AE';

ALTER TABLE public.cities
  ALTER COLUMN country SET DEFAULT 'UAE';

-- ============================================
-- 6. Add missing indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_hours_clinic ON public.clinic_hours(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_images_clinic ON public.clinic_images(clinic_id);
CREATE INDEX IF NOT EXISTS idx_google_reviews_clinic ON public.google_reviews(clinic_id);
CREATE INDEX IF NOT EXISTS idx_google_reviews_rating ON public.google_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_clinic_treatments_treatment ON public.clinic_treatments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(preferred_date);
CREATE INDEX IF NOT EXISTS idx_seo_pages_page_type ON public.seo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON public.seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_insurances_active ON public.insurances(is_active);

-- ============================================
-- 7. Drop duplicate/business tables if they exist
-- ============================================
-- Drop business_types if it exists (duplicate of clinic categories)
DROP TABLE IF EXISTS public.business_types CASCADE;

-- Drop clinic_specialties if it exists (duplicate of clinic_treatments relationship)
DROP TABLE IF EXISTS public.clinic_specialties CASCADE;

-- ============================================
-- 8. Add trigger for user_profiles
-- ============================================
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_hours_updated_at BEFORE UPDATE ON public.clinic_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON public.global_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
