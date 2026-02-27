
-- FINAL BATCH: All remaining missing tables

-- STATIC PAGE CACHE
CREATE TABLE public.static_page_cache (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), path TEXT NOT NULL, page_type TEXT, storage_path TEXT, generated_at TIMESTAMPTZ DEFAULT now(), is_stale BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.static_page_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage static cache" ON public.static_page_cache FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SCHEMA SETTINGS
CREATE TABLE public.schema_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), setting_key TEXT NOT NULL UNIQUE, setting_value JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.schema_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schema settings readable by all" ON public.schema_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage schema settings" ON public.schema_settings FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SUPPORT TICKETS
CREATE TABLE public.support_tickets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL, subject TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'open', priority TEXT DEFAULT 'medium', category TEXT, assigned_to UUID REFERENCES auth.users(id), resolved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage tickets" ON public.support_tickets FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- SUPPORT TICKET REPLIES
CREATE TABLE public.support_ticket_replies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL, user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, content TEXT NOT NULL, is_admin_reply BOOLEAN DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ticket replies" ON public.support_ticket_replies FOR SELECT USING (EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Users create replies" ON public.support_ticket_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage replies" ON public.support_ticket_replies FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Add plain_content to email_templates
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS plain_content TEXT;
