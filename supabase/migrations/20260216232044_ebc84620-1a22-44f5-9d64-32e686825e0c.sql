
-- Missing tables and columns

-- Add slug to insurances
ALTER TABLE public.insurances ADD COLUMN slug TEXT;

-- AI SEARCH SETTINGS
CREATE TABLE public.ai_search_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_search_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai search settings" ON public.ai_search_settings FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "AI search settings readable by all" ON public.ai_search_settings FOR SELECT USING (true);

-- AI SEARCH LOGS
CREATE TABLE public.ai_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_query TEXT,
  extracted_intent JSONB,
  results_count INTEGER DEFAULT 0,
  search_duration_ms INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai search logs" ON public.ai_search_logs FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone can insert search logs" ON public.ai_search_logs FOR INSERT WITH CHECK (true);

-- AI ERRORS
CREATE TABLE public.ai_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code TEXT,
  error_message TEXT,
  context_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai errors" ON public.ai_errors FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- AUTOMATION RULES
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB,
  action_type TEXT NOT NULL,
  action_config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  run_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage automation rules" ON public.automation_rules FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Add missing columns to seo_fix_jobs
ALTER TABLE public.seo_fix_jobs ADD COLUMN IF NOT EXISTS successful_pages INTEGER DEFAULT 0;
ALTER TABLE public.seo_fix_jobs ADD COLUMN IF NOT EXISTS failed_pages INTEGER DEFAULT 0;
ALTER TABLE public.seo_fix_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add missing columns to seo_fix_job_items
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS page_slug TEXT;
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS page_type TEXT;
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS before_snapshot TEXT;
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS after_snapshot TEXT;
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS word_count_before INTEGER;
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS word_count_after INTEGER;
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS changes_summary TEXT;
ALTER TABLE public.seo_fix_job_items ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;
