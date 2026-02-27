
-- AI Module Settings
CREATE TABLE IF NOT EXISTS public.ai_module_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  thresholds JSONB DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_module_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_module_settings_read" ON public.ai_module_settings FOR SELECT USING (true);
CREATE POLICY "ai_module_settings_admin" ON public.ai_module_settings FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- AI Events
CREATE TABLE IF NOT EXISTS public.ai_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  module TEXT NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  user_id UUID,
  triggered_by TEXT NOT NULL DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'pending',
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_events_read" ON public.ai_events FOR SELECT USING (true);
CREATE POLICY "ai_events_insert" ON public.ai_events FOR INSERT WITH CHECK (true);

-- AI Outputs
CREATE TABLE IF NOT EXISTS public.ai_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.ai_events(id),
  output_type TEXT NOT NULL,
  output_data JSONB DEFAULT '{}',
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_outputs_read" ON public.ai_outputs FOR SELECT USING (true);
CREATE POLICY "ai_outputs_insert" ON public.ai_outputs FOR INSERT WITH CHECK (true);

-- AI Inputs
CREATE TABLE IF NOT EXISTS public.ai_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.ai_events(id),
  input_type TEXT NOT NULL,
  input_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_inputs_read" ON public.ai_inputs FOR SELECT USING (true);
CREATE POLICY "ai_inputs_insert" ON public.ai_inputs FOR INSERT WITH CHECK (true);

-- AI Prompt Templates
CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  input_schema JSONB,
  output_schema JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_prompt_templates_read" ON public.ai_prompt_templates FOR SELECT USING (true);
CREATE POLICY "ai_prompt_templates_admin" ON public.ai_prompt_templates FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- AI Feedback
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.ai_events(id),
  user_id UUID,
  action TEXT NOT NULL,
  feedback_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_feedback_read" ON public.ai_feedback FOR SELECT USING (true);
CREATE POLICY "ai_feedback_insert" ON public.ai_feedback FOR INSERT WITH CHECK (true);
