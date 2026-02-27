
-- Add missing columns to clinic_automation_settings
ALTER TABLE public.clinic_automation_settings ADD COLUMN IF NOT EXISTS reminder_2_days BOOLEAN DEFAULT false;
ALTER TABLE public.clinic_automation_settings ADD COLUMN IF NOT EXISTS reminder_3_hours BOOLEAN DEFAULT false;
ALTER TABLE public.clinic_automation_settings ADD COLUMN IF NOT EXISTS reminder_channel TEXT DEFAULT 'sms';
ALTER TABLE public.clinic_automation_settings ADD COLUMN IF NOT EXISTS followup_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.clinic_automation_settings ADD COLUMN IF NOT EXISTS review_request_enabled BOOLEAN DEFAULT false;
