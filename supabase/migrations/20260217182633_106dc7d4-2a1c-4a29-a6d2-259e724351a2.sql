
-- Add missing fields to insurances table for SEO and content
ALTER TABLE public.insurances ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.insurances ADD COLUMN IF NOT EXISTS insurance_type text DEFAULT 'local' CHECK (insurance_type IN ('local', 'international'));
ALTER TABLE public.insurances ADD COLUMN IF NOT EXISTS coverage_notes text;
ALTER TABLE public.insurances ADD COLUMN IF NOT EXISTS verification_required boolean DEFAULT false;
ALTER TABLE public.insurances ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_insurances_slug ON public.insurances(slug);
CREATE INDEX IF NOT EXISTS idx_insurances_type ON public.insurances(insurance_type);

-- Create index on clinic_insurances for faster joins
CREATE INDEX IF NOT EXISTS idx_clinic_insurances_insurance_id ON public.clinic_insurances(insurance_id);
CREATE INDEX IF NOT EXISTS idx_clinic_insurances_clinic_id ON public.clinic_insurances(clinic_id);
