
-- 1. intake_form_templates
CREATE TABLE IF NOT EXISTS public.intake_form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  form_type TEXT NOT NULL DEFAULT 'general',
  fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.intake_form_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read intake_form_templates" ON public.intake_form_templates FOR SELECT USING (true);
CREATE POLICY "Clinic owners manage intake_form_templates" ON public.intake_form_templates FOR ALL USING (
  clinic_id IS NULL OR
  EXISTS (SELECT 1 FROM public.clinics WHERE clinics.id = intake_form_templates.clinic_id AND clinics.claimed_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 2. patient_form_submissions
CREATE TABLE IF NOT EXISTS public.patient_form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.intake_form_templates(id),
  clinic_id UUID REFERENCES public.clinics(id),
  patient_id UUID REFERENCES public.patients(id),
  patient_name TEXT,
  patient_email TEXT,
  patient_phone TEXT,
  form_data JSONB DEFAULT '{}'::jsonb,
  access_token TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners read submissions" ON public.patient_form_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE clinics.id = patient_form_submissions.clinic_id AND clinics.claimed_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);
CREATE POLICY "Public insert submissions" ON public.patient_form_submissions FOR INSERT WITH CHECK (true);

-- 3. form_workflow_settings
CREATE TABLE IF NOT EXISTS public.form_workflow_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  trigger_event TEXT DEFAULT 'booking_confirmed',
  form_sequence JSONB DEFAULT '[]'::jsonb,
  delivery_destinations JSONB DEFAULT '{"email": true, "dashboard": true, "google_drive": false}'::jsonb,
  require_otp_verification BOOLEAN DEFAULT false,
  capture_ip_address BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.form_workflow_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners manage form_workflow_settings" ON public.form_workflow_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE clinics.id = form_workflow_settings.clinic_id AND clinics.claimed_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 4. google_oauth_accounts
CREATE TABLE IF NOT EXISTS public.google_oauth_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  google_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  gmb_connected BOOLEAN DEFAULT false,
  scopes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.google_oauth_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own google_oauth_accounts" ON public.google_oauth_accounts FOR ALL USING (auth.uid() = user_id);

-- 5. Add missing columns to clinic_oauth_tokens
ALTER TABLE public.clinic_oauth_tokens ADD COLUMN IF NOT EXISTS gmb_booking_link_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.clinic_oauth_tokens ADD COLUMN IF NOT EXISTS gmb_booking_link_id TEXT;
ALTER TABLE public.clinic_oauth_tokens ADD COLUMN IF NOT EXISTS gmb_booking_link_set_at TIMESTAMPTZ;
