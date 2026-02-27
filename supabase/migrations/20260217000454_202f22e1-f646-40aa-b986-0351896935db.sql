
-- Blog Categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_categories_read" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_categories_admin" ON public.blog_categories FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Blog Authors
CREATE TABLE IF NOT EXISTS public.blog_authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_authors_read" ON public.blog_authors FOR SELECT USING (true);
CREATE POLICY "blog_authors_admin" ON public.blog_authors FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Blog Topic Clusters
CREATE TABLE IF NOT EXISTS public.blog_topic_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_name TEXT NOT NULL,
  primary_keyword TEXT NOT NULL,
  related_keywords TEXT[] DEFAULT '{}',
  pillar_page_slug TEXT,
  intent_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_topic_clusters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_topic_clusters_read" ON public.blog_topic_clusters FOR SELECT USING (true);
CREATE POLICY "blog_topic_clusters_admin" ON public.blog_topic_clusters FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Lead Quotas
CREATE TABLE IF NOT EXISTS public.lead_quotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  plan_id UUID REFERENCES public.subscription_plans(id),
  quota_limit INTEGER NOT NULL DEFAULT 50,
  leads_used INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_quotas_read" ON public.lead_quotas FOR SELECT USING (true);
CREATE POLICY "lead_quotas_admin" ON public.lead_quotas FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- dentist_settings: add missing columns
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS booking_require_approval BOOLEAN;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS allow_guest_booking BOOLEAN;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.dentist_settings ADD COLUMN IF NOT EXISTS booking_notes TEXT;

-- subscription_plans: add missing columns
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS price_yearly NUMERIC;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS billing_period TEXT;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS description TEXT;
