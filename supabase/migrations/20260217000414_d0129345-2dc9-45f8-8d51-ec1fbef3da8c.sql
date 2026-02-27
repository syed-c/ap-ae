
-- visitor_sessions: add missing columns
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.visitor_sessions ADD COLUMN IF NOT EXISTS patient_name TEXT;

-- page_views: add missing columns
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS page_path TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id);

-- appointments: add missing columns
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS manage_token TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booking_page_path TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booking_session_id TEXT;

-- states: add missing columns
ALTER TABLE public.states ADD COLUMN IF NOT EXISTS seo_status TEXT;
ALTER TABLE public.states ADD COLUMN IF NOT EXISTS page_exists BOOLEAN DEFAULT false;

-- cities: add missing columns
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS country_id UUID;

-- seo_pages: add missing columns
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMPTZ;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS noindex_reason TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS similarity_score NUMERIC;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS similar_to_slug TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS metadata_hash TEXT;
ALTER TABLE public.seo_pages ADD COLUMN IF NOT EXISTS generation_version INTEGER;

-- clinic_subscriptions: add missing columns
ALTER TABLE public.clinic_subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT;
ALTER TABLE public.clinic_subscriptions ADD COLUMN IF NOT EXISTS amount_paid NUMERIC;
ALTER TABLE public.clinic_subscriptions ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;
ALTER TABLE public.clinic_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- claim_requests: add missing columns
ALTER TABLE public.claim_requests ADD COLUMN IF NOT EXISTS verification_method TEXT;
ALTER TABLE public.claim_requests ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE public.claim_requests ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ;
ALTER TABLE public.claim_requests ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
ALTER TABLE public.claim_requests ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE public.claim_requests ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.claim_requests ADD COLUMN IF NOT EXISTS documents JSONB;

-- internal_reviews: add missing columns for reputation tab
ALTER TABLE public.internal_reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.internal_reviews ADD COLUMN IF NOT EXISTS is_fake_suspected BOOLEAN DEFAULT false;
ALTER TABLE public.internal_reviews ADD COLUMN IF NOT EXISTS fake_review_reason TEXT;
ALTER TABLE public.internal_reviews ADD COLUMN IF NOT EXISTS hipaa_flagged BOOLEAN DEFAULT false;
ALTER TABLE public.internal_reviews ADD COLUMN IF NOT EXISTS ai_suggested_reply TEXT;

-- subscription_plans: add missing column
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS price_monthly NUMERIC;

-- Add seo_pages page_type enum values
ALTER TYPE seo_page_type ADD VALUE IF NOT EXISTS 'blog';
ALTER TYPE seo_page_type ADD VALUE IF NOT EXISTS 'neighborhood';
