
-- Batch 4: Remaining missing tables and columns

-- Add missing columns to pending_areas
ALTER TABLE public.pending_areas ADD COLUMN IF NOT EXISTS suggested_name TEXT;
ALTER TABLE public.pending_areas ADD COLUMN IF NOT EXISTS suggested_slug TEXT;
ALTER TABLE public.pending_areas ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

-- Add missing columns to dentist_settings
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS allow_same_day_booking BOOLEAN DEFAULT false;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS min_advance_booking_hours INTEGER DEFAULT 24;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 30;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS confirmation_email_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS reminder_sms_enabled BOOLEAN DEFAULT false;

-- Add missing columns to seo_pages
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS seo_score NUMERIC(5,2);
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS page_intro TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS h2_sections JSONB;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS internal_links_intro TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS faqs JSONB;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS is_optimized BOOLEAN DEFAULT false;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS needs_optimization BOOLEAN DEFAULT false;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS last_audited_at TIMESTAMPTZ;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS optimized_at TIMESTAMPTZ;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ;

-- Add missing columns to seo_content_versions
ALTER TABLE public.seo_content_versions ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.seo_content_versions ADD COLUMN IF NOT EXISTS h1 TEXT;
ALTER TABLE public.seo_content_versions ADD COLUMN IF NOT EXISTS seo_score NUMERIC(5,2);
ALTER TABLE public.seo_content_versions ADD COLUMN IF NOT EXISTS faq JSONB;
ALTER TABLE public.seo_content_versions ADD COLUMN IF NOT EXISTS change_source TEXT;
ALTER TABLE public.seo_content_versions ADD COLUMN IF NOT EXISTS change_reason TEXT;
ALTER TABLE public.seo_content_versions ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- Add missing columns to blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- CRM NUMBERS
CREATE TABLE public.crm_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'twilio',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm numbers" ON public.crm_numbers FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
