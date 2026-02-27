
-- =====================================================
-- DENTAL DIRECTORY PLATFORM - COMPLETE DATABASE SCHEMA
-- =====================================================

-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin', 'district_manager', 'dentist', 'patient');
CREATE TYPE public.claim_status AS ENUM ('unclaimed', 'pending', 'claimed');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified', 'expired');
CREATE TYPE public.clinic_source AS ENUM ('manual', 'gmb', 'import');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost', 'spam');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.review_sentiment AS ENUM ('positive', 'negative');
CREATE TYPE public.seo_page_type AS ENUM ('state', 'city', 'treatment', 'city_treatment', 'clinic');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- COUNTRIES
CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Countries readable by all" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Admins manage countries" ON public.countries FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- STATES
CREATE TABLE public.states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT 'AE',
  image_url TEXT,
  dentist_count INTEGER NOT NULL DEFAULT 0,
  clinic_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "States readable by all" ON public.states FOR SELECT USING (true);
CREATE POLICY "Admins manage states" ON public.states FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- CITIES
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  state_id UUID REFERENCES public.states(id) ON DELETE SET NULL,
  country TEXT NOT NULL DEFAULT 'AE',
  image_url TEXT,
  dentist_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  seo_status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities readable by all" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admins manage cities" ON public.cities FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- AREAS
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  image_url TEXT,
  dentist_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Areas readable by all" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Admins manage areas" ON public.areas FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- TREATMENTS
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Treatments readable by all" ON public.treatments FOR SELECT USING (true);
CREATE POLICY "Admins manage treatments" ON public.treatments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- INSURANCES
CREATE TABLE public.insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insurances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insurances readable by all" ON public.insurances FOR SELECT USING (true);
CREATE POLICY "Admins manage insurances" ON public.insurances FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- CLINICS
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  whatsapp TEXT,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_place_id TEXT,
  google_maps_url TEXT,
  claim_status claim_status NOT NULL DEFAULT 'unclaimed',
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  source clinic_source NOT NULL DEFAULT 'manual',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seo_visible BOOLEAN NOT NULL DEFAULT true,
  rank_score INTEGER NOT NULL DEFAULT 0,
  duplicate_group_id TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  gmb_data JSONB,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  total_leads INTEGER NOT NULL DEFAULT 0,
  opening_hours JSONB,
  photos JSONB,
  location_verified BOOLEAN NOT NULL DEFAULT false,
  location_pending_approval BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinics readable by all" ON public.clinics FOR SELECT USING (true);
CREATE POLICY "Clinic owners can update" ON public.clinics FOR UPDATE USING (auth.uid() = claimed_by OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert clinics" ON public.clinics FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'district_manager'));
CREATE POLICY "Admins can delete clinics" ON public.clinics FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));

-- CLINIC_INSURANCES (junction)
CREATE TABLE public.clinic_insurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  insurance_id UUID REFERENCES public.insurances(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, insurance_id)
);
ALTER TABLE public.clinic_insurances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readable by all" ON public.clinic_insurances FOR SELECT USING (true);
CREATE POLICY "Admins manage" ON public.clinic_insurances FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- CLINIC_TREATMENTS (junction)
CREATE TABLE public.clinic_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE CASCADE NOT NULL,
  price_aed NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, treatment_id)
);
ALTER TABLE public.clinic_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readable by all" ON public.clinic_treatments FOR SELECT USING (true);
CREATE POLICY "Admins manage" ON public.clinic_treatments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- DENTISTS
CREATE TABLE public.dentists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  qualifications TEXT[],
  experience_years INTEGER,
  languages TEXT[],
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dentists readable by all" ON public.dentists FOR SELECT USING (true);
CREATE POLICY "Dentists can update own" ON public.dentists FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage dentists" ON public.dentists FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- PATIENTS
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners can view patients" ON public.patients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Clinic owners can manage patients" ON public.patients FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);

-- LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE SET NULL,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT,
  patient_phone TEXT NOT NULL,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  notes TEXT,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leads readable by clinic owners/admins" ON public.leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Anyone can create leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE SET NULL,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT,
  patient_phone TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  preferred_date TEXT,
  preferred_time TEXT,
  confirmed_date TEXT,
  confirmed_time TEXT,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  is_disputed BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Appointments readable by clinic owners/admins" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage appointments" ON public.appointments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- INTERNAL REVIEWS
CREATE TABLE public.internal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT,
  rating NUMERIC(3,2),
  title TEXT,
  content TEXT,
  initial_sentiment review_sentiment,
  status review_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  is_verified_patient BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews readable by all" ON public.internal_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can create reviews" ON public.internal_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage reviews" ON public.internal_reviews FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- GOOGLE REVIEWS (synced from GMB)
CREATE TABLE public.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  google_review_id TEXT UNIQUE,
  reviewer_name TEXT,
  reviewer_photo_url TEXT,
  rating INTEGER,
  comment TEXT,
  reply TEXT,
  reply_status TEXT DEFAULT 'none',
  review_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Google reviews readable by all" ON public.google_reviews FOR SELECT USING (true);
CREATE POLICY "Admins manage google reviews" ON public.google_reviews FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- CLAIM REQUESTS
CREATE TABLE public.claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own claims" ON public.claim_requests FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Auth users can create claims" ON public.claim_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage claims" ON public.claim_requests FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SUBSCRIPTION PLANS
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_aed NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_period TEXT DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  features JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans readable by all" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Admins manage plans" ON public.subscription_plans FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- CLINIC SUBSCRIPTIONS
CREATE TABLE public.clinic_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status subscription_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,
  override_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners can view own subs" ON public.clinic_subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Admins manage subscriptions" ON public.clinic_subscriptions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- FEATURE REGISTRY
CREATE TABLE public.feature_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feature registry readable by all" ON public.feature_registry FOR SELECT USING (true);
CREATE POLICY "Admins manage features" ON public.feature_registry FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- PLAN FEATURES
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE CASCADE NOT NULL,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  usage_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plan features readable by all" ON public.plan_features FOR SELECT USING (true);
CREATE POLICY "Admins manage plan features" ON public.plan_features FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- PLATFORM ALERTS
CREATE TABLE public.platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view alerts" ON public.platform_alerts FOR SELECT USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'district_manager'));
CREATE POLICY "Admins manage alerts" ON public.platform_alerts FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Auth users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- GLOBAL SETTINGS
CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings readable by all" ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.global_settings FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SEO PAGES
CREATE TABLE public.seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type seo_page_type NOT NULL,
  state_id UUID REFERENCES public.states(id) ON DELETE SET NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  content TEXT,
  is_indexed BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_thin_content BOOLEAN NOT NULL DEFAULT false,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  ai_suggestions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SEO pages readable by all" ON public.seo_pages FOR SELECT USING (true);
CREATE POLICY "Admins manage SEO pages" ON public.seo_pages FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SEO FIX JOBS
CREATE TABLE public.seo_fix_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  filters JSONB,
  regeneration_config JSONB,
  target_word_count INTEGER DEFAULT 0,
  apply_mode TEXT DEFAULT 'draft',
  quality_threshold NUMERIC(5,2) DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  processed_pages INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.seo_fix_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage SEO jobs" ON public.seo_fix_jobs FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SEO FIX JOB ITEMS
CREATE TABLE public.seo_fix_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.seo_fix_jobs(id) ON DELETE CASCADE NOT NULL,
  seo_page_id UUID REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  old_content TEXT,
  new_content TEXT,
  quality_score NUMERIC(5,2),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_fix_job_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage SEO job items" ON public.seo_fix_job_items FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- BLOG POSTS
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts readable by all" ON public.blog_posts FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- PENDING AREAS
CREATE TABLE public.pending_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE NOT NULL,
  area_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pending areas readable by owners/admins" ON public.pending_areas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Auth users can create pending areas" ON public.pending_areas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage pending areas" ON public.pending_areas FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- GMB SCRAPER SESSIONS
CREATE TABLE public.gmb_scraper_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running',
  state_id UUID REFERENCES public.states(id),
  city_ids UUID[],
  total_results INTEGER DEFAULT 0,
  imported INTEGER DEFAULT 0,
  duplicates INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gmb_scraper_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scraper sessions" ON public.gmb_scraper_sessions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- GMB SCRAPER RESULTS
CREATE TABLE public.gmb_scraper_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.gmb_scraper_sessions(id) ON DELETE CASCADE NOT NULL,
  place_id TEXT,
  name TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating NUMERIC(3,2),
  review_count INTEGER DEFAULT 0,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  raw_data JSONB,
  import_status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, place_id)
);
ALTER TABLE public.gmb_scraper_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scraper results" ON public.gmb_scraper_results FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- REVIEW REQUESTS
CREATE TABLE public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT,
  patient_phone TEXT,
  patient_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'sms',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners can view review requests" ON public.review_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Clinic owners can manage review requests" ON public.review_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);

-- REVIEW FUNNEL EVENTS
CREATE TABLE public.review_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  review_request_id UUID REFERENCES public.review_requests(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners can view funnel events" ON public.review_funnel_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Anyone can insert funnel events" ON public.review_funnel_events FOR INSERT WITH CHECK (true);

-- CLINIC MESSAGES
CREATE TABLE public.clinic_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  channel TEXT NOT NULL DEFAULT 'sms',
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners can view messages" ON public.clinic_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Clinic owners can manage messages" ON public.clinic_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);

-- CLINIC AUTOMATION SETTINGS
CREATE TABLE public.clinic_automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_messaging_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_1_day BOOLEAN NOT NULL DEFAULT false,
  reminder_7_day BOOLEAN NOT NULL DEFAULT false,
  auto_review_request BOOLEAN NOT NULL DEFAULT false,
  welcome_message_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_automation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners can view automation" ON public.clinic_automation_settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Clinic owners can manage automation" ON public.clinic_automation_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON public.states FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dentists_updated_at BEFORE UPDATE ON public.dentists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internal_reviews_updated_at BEFORE UPDATE ON public.internal_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_google_reviews_updated_at BEFORE UPDATE ON public.google_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_claim_requests_updated_at BEFORE UPDATE ON public.claim_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_subscriptions_updated_at BEFORE UPDATE ON public.clinic_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_global_settings_updated_at BEFORE UPDATE ON public.global_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_pages_updated_at BEFORE UPDATE ON public.seo_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_fix_jobs_updated_at BEFORE UPDATE ON public.seo_fix_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seo_fix_job_items_updated_at BEFORE UPDATE ON public.seo_fix_job_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_review_requests_updated_at BEFORE UPDATE ON public.review_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_automation_settings_updated_at BEFORE UPDATE ON public.clinic_automation_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
