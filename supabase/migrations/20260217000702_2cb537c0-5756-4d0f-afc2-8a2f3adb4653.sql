
-- user_onboarding
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  onboarding_status TEXT DEFAULT 'pending',
  step_completed INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_onboarding_own" ON public.user_onboarding FOR ALL USING (auth.uid() = user_id);

-- blog_posts: add missing columns
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS author_name TEXT;

-- user_tab_permissions: add missing columns  
ALTER TABLE public.user_tab_permissions ADD COLUMN IF NOT EXISTS can_access BOOLEAN DEFAULT true;
ALTER TABLE public.user_tab_permissions ADD COLUMN IF NOT EXISTS granted_by UUID;

-- seo_metadata_history: add missing columns
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS previous_h1 TEXT;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS new_h1 TEXT;
ALTER TABLE public.seo_metadata_history ADD COLUMN IF NOT EXISTS change_reason TEXT;

-- Add 'service' to seo_page_type enum
ALTER TYPE seo_page_type ADD VALUE IF NOT EXISTS 'service';
