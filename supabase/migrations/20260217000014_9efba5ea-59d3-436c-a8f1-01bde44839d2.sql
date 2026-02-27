
-- Add missing columns to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS first_visit_at TIMESTAMPTZ;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_opted_in_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_member_id TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS preferred_contact TEXT DEFAULT 'phone';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_deleted_by_dentist BOOLEAN DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add caption to clinic_images
ALTER TABLE public.clinic_images ADD COLUMN IF NOT EXISTS caption TEXT;

-- Create gmb_link_requests table
CREATE TABLE IF NOT EXISTS public.gmb_link_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL,
  token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour')
);
ALTER TABLE public.gmb_link_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own gmb_link_requests" ON public.gmb_link_requests FOR ALL USING (auth.uid() = initiated_by OR public.has_role(auth.uid(), 'super_admin'));

-- Add source to review_funnel_events
ALTER TABLE public.review_funnel_events ADD COLUMN IF NOT EXISTS source TEXT;

-- Add recipient_name to review_requests
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS recipient_name TEXT;
