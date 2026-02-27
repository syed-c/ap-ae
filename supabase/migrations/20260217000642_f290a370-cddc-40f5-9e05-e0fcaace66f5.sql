
-- reputation_kpis
CREATE TABLE IF NOT EXISTS public.reputation_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id),
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reputation_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reputation_kpis_read" ON public.reputation_kpis FOR SELECT USING (true);
CREATE POLICY "reputation_kpis_write" ON public.reputation_kpis FOR INSERT WITH CHECK (true);

-- slot_locks
CREATE TABLE IF NOT EXISTS public.slot_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  locked_by_user_id UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  converted_to_appointment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.slot_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slot_locks_read" ON public.slot_locks FOR SELECT USING (true);
CREATE POLICY "slot_locks_write" ON public.slot_locks FOR ALL USING (true);

-- user_tab_permissions
CREATE TABLE IF NOT EXISTS public.user_tab_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tab_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tab_key)
);
ALTER TABLE public.user_tab_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_tab_permissions_read" ON public.user_tab_permissions FOR SELECT USING (true);
CREATE POLICY "user_tab_permissions_admin" ON public.user_tab_permissions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- appointments: add start_datetime and end_datetime
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMPTZ;

-- provider_verifications: add missing columns
ALTER TABLE public.provider_verifications ADD COLUMN IF NOT EXISTS dentist_id UUID REFERENCES public.dentists(id);
ALTER TABLE public.provider_verifications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.provider_verifications ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE public.provider_verifications ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';

-- seo_metadata_history: add missing columns
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS page_id UUID;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS previous_title TEXT;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS previous_meta_description TEXT;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS new_title TEXT;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS new_meta_description TEXT;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'applied';
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS reverted_at TIMESTAMPTZ;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS reverted_by TEXT;
