
-- BATCH 6: Final remaining tables and column fixes

-- Fix seo_fix_job_items: change before_snapshot/after_snapshot to JSONB
ALTER TABLE public.seo_fix_job_items ALTER COLUMN before_snapshot TYPE JSONB USING before_snapshot::JSONB;
ALTER TABLE public.seo_fix_job_items ALTER COLUMN after_snapshot TYPE JSONB USING after_snapshot::JSONB;

-- Add missing columns to email_enrichment_sessions
ALTER TABLE public.email_enrichment_sessions ADD COLUMN IF NOT EXISTS processed_count INTEGER DEFAULT 0;
ALTER TABLE public.email_enrichment_sessions ADD COLUMN IF NOT EXISTS success_count INTEGER DEFAULT 0;
ALTER TABLE public.email_enrichment_sessions ADD COLUMN IF NOT EXISTS skipped_count INTEGER DEFAULT 0;
ALTER TABLE public.email_enrichment_sessions ADD COLUMN IF NOT EXISTS failed_count INTEGER DEFAULT 0;
ALTER TABLE public.email_enrichment_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add missing columns to email_enrichment_results
ALTER TABLE public.email_enrichment_results ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.email_enrichment_results ADD COLUMN IF NOT EXISTS emails_found TEXT[];
ALTER TABLE public.email_enrichment_results ADD COLUMN IF NOT EXISTS email_selected TEXT;
ALTER TABLE public.email_enrichment_results ADD COLUMN IF NOT EXISTS match_method TEXT;
ALTER TABLE public.email_enrichment_results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add missing column to pending_areas
ALTER TABLE public.pending_areas ADD COLUMN IF NOT EXISTS clinic_id_ref UUID REFERENCES public.clinics(id) ON DELETE CASCADE;

-- EMAIL TEMPLATES
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email templates" ON public.email_templates FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- OUTREACH CAMPAIGNS
CREATE TABLE public.outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES public.email_templates(id),
  target_filter JSONB,
  schedule_config JSONB,
  max_sends_per_day INTEGER DEFAULT 50,
  max_sends_per_clinic INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaigns" ON public.outreach_campaigns FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- OUTREACH SENDS
CREATE TABLE public.outreach_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  email TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.outreach_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sends" ON public.outreach_sends FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
