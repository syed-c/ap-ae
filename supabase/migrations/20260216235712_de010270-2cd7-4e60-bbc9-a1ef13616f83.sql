
-- 1. dentist_availability_rules
CREATE TABLE IF NOT EXISTS public.dentist_availability_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '17:00',
  break_start TEXT,
  break_end TEXT,
  slot_duration_minutes INTEGER DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dentist_availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read availability rules" ON public.dentist_availability_rules FOR SELECT USING (true);
CREATE POLICY "Clinic owners manage availability rules" ON public.dentist_availability_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE clinics.id = dentist_availability_rules.clinic_id AND clinics.claimed_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 2. availability_blocks
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason TEXT,
  block_type TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read availability blocks" ON public.availability_blocks FOR SELECT USING (true);
CREATE POLICY "Clinic owners manage availability blocks" ON public.availability_blocks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE clinics.id = availability_blocks.clinic_id AND clinics.claimed_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 3. Add missing columns to appointment_types
ALTER TABLE public.appointment_types ADD COLUMN IF NOT EXISTS price_from NUMERIC;
ALTER TABLE public.appointment_types ADD COLUMN IF NOT EXISTS price_to NUMERIC;
ALTER TABLE public.appointment_types ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- 4. Add is_assigned to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_assigned BOOLEAN DEFAULT true;
