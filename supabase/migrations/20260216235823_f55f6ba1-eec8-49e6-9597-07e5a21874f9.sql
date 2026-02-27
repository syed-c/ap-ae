
-- Add missing columns to dentist_settings
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_new_appointment BOOLEAN DEFAULT true;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_form_submission BOOLEAN DEFAULT true;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_cancellation BOOLEAN DEFAULT true;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_message BOOLEAN DEFAULT true;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_channel_email BOOLEAN DEFAULT true;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_channel_whatsapp BOOLEAN DEFAULT false;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_channel_dashboard BOOLEAN DEFAULT true;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_email_secondary TEXT;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS notification_whatsapp_number TEXT;

-- Add missing columns to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_opted_in_sms BOOLEAN DEFAULT false;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;

-- Add description to intake_form_templates
ALTER TABLE public.intake_form_templates ADD COLUMN IF NOT EXISTS description TEXT;
