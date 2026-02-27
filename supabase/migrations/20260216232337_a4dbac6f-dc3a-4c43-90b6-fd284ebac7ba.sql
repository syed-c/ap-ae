
-- BATCH 5: All remaining missing tables and columns

-- Add 'blog' to seo_page_type enum
ALTER TYPE public.seo_page_type ADD VALUE IF NOT EXISTS 'blog';

-- Add missing columns to clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS is_active_listing BOOLEAN DEFAULT true;

-- Add missing columns to clinic_messages
ALTER TABLE public.clinic_messages ADD COLUMN IF NOT EXISTS recipient_phone TEXT;
ALTER TABLE public.clinic_messages ADD COLUMN IF NOT EXISTS message_content TEXT;
ALTER TABLE public.clinic_messages ADD COLUMN IF NOT EXISTS template_type TEXT;

-- Add missing columns to clinic_automation_settings
ALTER TABLE public.clinic_automation_settings ADD COLUMN IF NOT EXISTS daily_message_limit INTEGER DEFAULT 50;

-- Add missing columns to gmb_scraper_sessions
ALTER TABLE public.gmb_scraper_sessions ADD COLUMN IF NOT EXISTS state_name TEXT;
ALTER TABLE public.gmb_scraper_sessions ADD COLUMN IF NOT EXISTS total_found INTEGER DEFAULT 0;
ALTER TABLE public.gmb_scraper_sessions ADD COLUMN IF NOT EXISTS imported_count INTEGER DEFAULT 0;
ALTER TABLE public.gmb_scraper_sessions ADD COLUMN IF NOT EXISTS duplicate_count INTEGER DEFAULT 0;

-- Add price_monthly to subscription_plans
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS price_monthly NUMERIC(10,2) DEFAULT 0;

-- EMAIL ENRICHMENT SESSIONS
CREATE TABLE public.email_enrichment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES public.states(id),
  city_id UUID REFERENCES public.cities(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total_to_process INTEGER DEFAULT 0,
  processed INTEGER DEFAULT 0,
  found_emails INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  needs_review_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_enrichment_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage enrichment sessions" ON public.email_enrichment_sessions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- EMAIL ENRICHMENT RESULTS
CREATE TABLE public.email_enrichment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.email_enrichment_sessions(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  found_email TEXT,
  match_confidence NUMERIC(5,2),
  source TEXT,
  needs_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_enrichment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage enrichment results" ON public.email_enrichment_results FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- CLINIC OAUTH TOKENS
CREATE TABLE public.clinic_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  gmb_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners can view oauth tokens" ON public.clinic_oauth_tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Admins manage oauth tokens" ON public.clinic_oauth_tokens FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- REVIEW CLICKS
CREATE TABLE public.review_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Review clicks readable by clinic owners" ON public.review_clicks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Anyone can insert review clicks" ON public.review_clicks FOR INSERT WITH CHECK (true);

-- PAGE CONTENT
CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL UNIQUE,
  page_type TEXT,
  title TEXT,
  content JSONB,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Page content readable by all" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "Admins manage page content" ON public.page_content FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- CLINIC HOURS
CREATE TABLE public.clinic_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL,
  open_time TEXT,
  close_time TEXT,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic hours readable by all" ON public.clinic_hours FOR SELECT USING (true);
CREATE POLICY "Clinic owners manage hours" ON public.clinic_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);

-- CLINIC IMAGES
CREATE TABLE public.clinic_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinic_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic images readable by all" ON public.clinic_images FOR SELECT USING (true);
CREATE POLICY "Clinic owners manage images" ON public.clinic_images FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);

-- MESSAGING TEMPLATES
CREATE TABLE public.messaging_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'sms',
  content TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messaging_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.messaging_templates FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Templates readable by authenticated" ON public.messaging_templates FOR SELECT USING (auth.uid() IS NOT NULL);

-- CONTACT SUBMISSIONS
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact forms" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage submissions" ON public.contact_submissions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- PINNED CLINICS (for city pages)
CREATE TABLE public.pinned_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pinned_clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pinned clinics readable by all" ON public.pinned_clinics FOR SELECT USING (true);
CREATE POLICY "Admins manage pinned clinics" ON public.pinned_clinics FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
