
-- 1. visitor_journeys
CREATE TABLE IF NOT EXISTS public.visitor_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_session_id UUID REFERENCES public.visitor_sessions(id),
  journey_stage TEXT NOT NULL,
  page_path TEXT NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  dentist_id UUID REFERENCES public.dentists(id),
  step_number INTEGER DEFAULT 1,
  converted BOOLEAN DEFAULT false,
  appointment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on visitor_journeys" ON public.visitor_journeys FOR ALL USING (true) WITH CHECK (true);

-- 2. budget_ranges
CREATE TABLE IF NOT EXISTS public.budget_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  min_value NUMERIC,
  max_value NUMERIC,
  currency TEXT DEFAULT 'AED',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_ranges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read budget_ranges" ON public.budget_ranges FOR SELECT USING (true);
CREATE POLICY "Super admin manage budget_ranges" ON public.budget_ranges FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- 3. appointment_types
CREATE TABLE IF NOT EXISTS public.appointment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  price NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read appointment_types" ON public.appointment_types FOR SELECT USING (true);
CREATE POLICY "Clinic owners manage appointment_types" ON public.appointment_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.clinics WHERE clinics.id = appointment_types.clinic_id AND clinics.claimed_by = auth.uid())
  OR public.has_role(auth.uid(), 'super_admin')
);

-- 4. booking_notifications
CREATE TABLE IF NOT EXISTS public.booking_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  appointment_id UUID REFERENCES public.appointments(id),
  notification_type TEXT NOT NULL DEFAULT 'booking',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.booking_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.booking_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service insert notifications" ON public.booking_notifications FOR INSERT WITH CHECK (true);

-- 5. Add missing columns to clinic_oauth_tokens
ALTER TABLE public.clinic_oauth_tokens ADD COLUMN IF NOT EXISTS gmb_connected BOOLEAN DEFAULT false;
ALTER TABLE public.clinic_oauth_tokens ADD COLUMN IF NOT EXISTS gmb_last_sync_at TIMESTAMPTZ;

-- 6. Add missing columns to support_ticket_replies
ALTER TABLE public.support_ticket_replies ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.support_ticket_replies ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;
