
-- platform_notifications
CREATE TABLE IF NOT EXISTS public.platform_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  role TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  severity TEXT NOT NULL DEFAULT 'info',
  action_type TEXT,
  action_url TEXT,
  action_data JSONB,
  entity_type TEXT,
  entity_id TEXT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_notifications_read" ON public.platform_notifications FOR SELECT USING (true);
CREATE POLICY "platform_notifications_write" ON public.platform_notifications FOR ALL USING (true);

-- role_presets
CREATE TABLE IF NOT EXISTS public.role_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.role_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_presets_read" ON public.role_presets FOR SELECT USING (true);
CREATE POLICY "role_presets_admin" ON public.role_presets FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- user_permission_overrides
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_permission_overrides_read" ON public.user_permission_overrides FOR SELECT USING (true);
CREATE POLICY "user_permission_overrides_admin" ON public.user_permission_overrides FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- profile_analytics: add event_type column
ALTER TABLE public.profile_analytics ADD COLUMN IF NOT EXISTS event_type TEXT;

-- page_content: add missing columns
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS noindex BOOLEAN DEFAULT false;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS h1 TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS hero_intro TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS hero_image TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS hero_stats JSONB;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS section_1_title TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS section_1_content TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS section_2_title TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS section_2_content TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS section_3_title TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS section_3_content TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS body_content TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS cta_text TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS cta_button_text TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS cta_button_url TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS faqs JSONB;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS featured_image TEXT;
ALTER TABLE public.page_content ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

-- blog_authors: add missing columns
ALTER TABLE public.blog_authors ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.blog_authors ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'author';

-- ai_errors: add event_id column
ALTER TABLE public.ai_errors ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.ai_events(id);
