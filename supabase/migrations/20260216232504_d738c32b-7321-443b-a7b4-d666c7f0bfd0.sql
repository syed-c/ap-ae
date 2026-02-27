
-- BATCH 7: Final missing tables

-- Add 'neighborhood' to seo_page_type enum
ALTER TYPE public.seo_page_type ADD VALUE IF NOT EXISTS 'neighborhood';

-- Add rating to review_funnel_events
ALTER TABLE public.review_funnel_events ADD COLUMN IF NOT EXISTS rating INTEGER;

-- PAGE VIEWS
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT,
  page_type TEXT,
  entity_id UUID,
  visitor_id TEXT,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view page_views" ON public.page_views FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone insert page_views" ON public.page_views FOR INSERT WITH CHECK (true);

-- VISITOR SESSIONS
CREATE TABLE public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT,
  session_start TIMESTAMPTZ DEFAULT now(),
  session_end TIMESTAMPTZ,
  pages_viewed INTEGER DEFAULT 0,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view sessions" ON public.visitor_sessions FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Anyone insert sessions" ON public.visitor_sessions FOR INSERT WITH CHECK (true);

-- DISTRICT ASSIGNMENTS
CREATE TABLE public.district_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  city TEXT,
  area TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.district_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage district assignments" ON public.district_assignments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SEO METADATA HISTORY
CREATE TABLE public.seo_metadata_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seo_page_id UUID REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_metadata_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage seo metadata history" ON public.seo_metadata_history FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SEO TASKS
CREATE TABLE public.seo_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage seo tasks" ON public.seo_tasks FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
