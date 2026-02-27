
-- Add missing columns to visitor_sessions
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS os text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS visitor_fingerprint text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS landing_page text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS total_pageviews integer DEFAULT 0;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS total_events integer DEFAULT 0;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS patient_email text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS patient_phone text;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS patient_id uuid;

-- Add missing columns to page_views
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS visitor_session_id uuid;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS page_title text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS city_slug text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS state_slug text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS treatment_slug text;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS dentist_id uuid;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS time_on_page_seconds integer;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS scroll_depth_percent integer;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS exit_page boolean DEFAULT false;
