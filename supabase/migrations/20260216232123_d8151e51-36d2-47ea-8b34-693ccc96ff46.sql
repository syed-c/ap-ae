
-- Missing tables and columns (batch 3)

-- Add missing columns to automation_rules
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS rule_type TEXT;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;

-- Add missing columns to ai_search_logs
ALTER TABLE public.ai_search_logs ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT false;
ALTER TABLE public.ai_search_logs ADD COLUMN IF NOT EXISTS clicked_result_id TEXT;

-- Add missing columns to seo_fix_job_items
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS before_score NUMERIC(5,2);
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS after_score NUMERIC(5,2);
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS is_applied BOOLEAN DEFAULT false;
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS is_rolled_back BOOLEAN DEFAULT false;

-- Add gmb_connected to clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS gmb_connected BOOLEAN DEFAULT false;

-- AUTOMATION LOGS
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  details JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage automation logs" ON public.automation_logs FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- VISITOR EVENTS
CREATE TABLE public.visitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  visitor_id TEXT,
  page_url TEXT,
  referrer TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitor events readable by clinic owners/admins" ON public.visitor_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Anyone can insert visitor events" ON public.visitor_events FOR INSERT WITH CHECK (true);

-- PROFILE ANALYTICS
CREATE TABLE public.profile_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile analytics readable by clinic owners/admins" ON public.profile_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE id = clinic_id AND (claimed_by = auth.uid() OR owner_id = auth.uid()))
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Admins manage profile analytics" ON public.profile_analytics FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- DENTIST SETTINGS
CREATE TABLE public.dentist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_enabled BOOLEAN DEFAULT false,
  auto_confirm BOOLEAN DEFAULT false,
  notification_email TEXT,
  notification_phone TEXT,
  working_hours JSONB,
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dentist_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dentist settings readable by owners/admins" ON public.dentist_settings FOR SELECT USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Dentist settings manageable by owners/admins" ON public.dentist_settings FOR ALL USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin')
);

-- SEO CONTENT VERSIONS
CREATE TABLE public.seo_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seo_page_id UUID REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  version_number INTEGER DEFAULT 1,
  content TEXT,
  title TEXT,
  meta_description TEXT,
  quality_score NUMERIC(5,2),
  word_count INTEGER,
  generated_by TEXT,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_content_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage seo content versions" ON public.seo_content_versions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
