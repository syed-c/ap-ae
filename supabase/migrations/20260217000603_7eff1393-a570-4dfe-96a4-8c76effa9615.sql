
-- provider_verifications
CREATE TABLE IF NOT EXISTS public.provider_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id),
  user_id UUID,
  verification_type TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'pending',
  verification_code TEXT,
  sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  contact_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider_verifications_read" ON public.provider_verifications FOR SELECT USING (true);
CREATE POLICY "provider_verifications_write" ON public.provider_verifications FOR ALL USING (true);

-- role_presets: add is_system column
ALTER TABLE public.role_presets ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- dentists: add missing columns for useProfiles
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
