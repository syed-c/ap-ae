
-- dentists: add missing columns
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS professional_type TEXT DEFAULT 'dentist';
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS specializations TEXT[];
ALTER TABLE public.dentists ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- google_reviews: add missing columns
ALTER TABLE public.google_reviews ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.google_reviews ADD COLUMN IF NOT EXISTS text_content TEXT;
ALTER TABLE public.google_reviews ADD COLUMN IF NOT EXISTS author_photo_url TEXT;
ALTER TABLE public.google_reviews ADD COLUMN IF NOT EXISTS reply_text TEXT;

-- user_permission_overrides: add missing columns
ALTER TABLE public.user_permission_overrides ADD COLUMN IF NOT EXISTS permission_key TEXT;
ALTER TABLE public.user_permission_overrides ADD COLUMN IF NOT EXISTS is_granted BOOLEAN DEFAULT true;
ALTER TABLE public.user_permission_overrides ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
