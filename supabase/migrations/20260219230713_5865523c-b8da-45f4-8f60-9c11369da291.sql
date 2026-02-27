
-- Editorial Calendar table
CREATE TABLE public.editorial_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  status TEXT NOT NULL DEFAULT 'idea',
  priority TEXT DEFAULT 'medium',
  assigned_to TEXT,
  topic_cluster_id UUID REFERENCES public.blog_topic_clusters(id),
  target_keyword TEXT,
  secondary_keywords TEXT[],
  content_type TEXT DEFAULT 'blog_post',
  target_word_count INTEGER DEFAULT 1500,
  scheduled_date DATE,
  published_date DATE,
  notes TEXT,
  template_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blog Content Templates table
CREATE TABLE public.blog_content_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  content_structure JSONB NOT NULL DEFAULT '[]',
  target_word_count INTEGER DEFAULT 1500,
  seo_guidelines TEXT,
  example_titles TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for template_id
ALTER TABLE public.editorial_calendar 
  ADD CONSTRAINT editorial_calendar_template_id_fkey 
  FOREIGN KEY (template_id) REFERENCES public.blog_content_templates(id);

-- Enable RLS
ALTER TABLE public.editorial_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_content_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (using existing admin role pattern)
CREATE POLICY "Allow all for authenticated users" ON public.editorial_calendar
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.blog_content_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Public read for templates
CREATE POLICY "Public can view active templates" ON public.blog_content_templates
  FOR SELECT USING (is_active = true);

-- Update triggers
CREATE TRIGGER update_editorial_calendar_updated_at
  BEFORE UPDATE ON public.editorial_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_content_templates_updated_at
  BEFORE UPDATE ON public.blog_content_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed topic clusters for dental content strategy
INSERT INTO public.blog_topic_clusters (cluster_name, primary_keyword, related_keywords, intent_type, pillar_page_slug) VALUES
  ('Dental Implants Guide', 'dental implants', ARRAY['implant cost', 'implant procedure', 'implant recovery', 'all-on-4', 'mini implants'], 'informational', '/services/dental-implants'),
  ('Teeth Whitening', 'teeth whitening', ARRAY['professional whitening', 'at-home whitening', 'whitening cost', 'whitening side effects', 'best whitening'], 'informational', '/services/teeth-whitening'),
  ('Invisalign & Braces', 'invisalign vs braces', ARRAY['clear aligners', 'invisalign cost', 'braces for adults', 'orthodontist', 'treatment time'], 'commercial', '/services/invisalign'),
  ('Emergency Dental Care', 'emergency dentist', ARRAY['toothache relief', 'broken tooth', 'dental abscess', 'knocked out tooth', 'emergency root canal'], 'transactional', '/emergency-dentist'),
  ('Cosmetic Dentistry', 'cosmetic dentistry', ARRAY['veneers', 'dental bonding', 'smile makeover', 'cosmetic dentist cost', 'before and after'], 'commercial', '/services/cosmetic-dentistry'),
  ('Dental Insurance', 'dental insurance guide', ARRAY['best dental insurance', 'dental coverage', 'insurance plans', 'in-network dentist', 'PPO vs HMO dental'], 'informational', '/insurance'),
  ('Pediatric Dentistry', 'kids dentist', ARRAY['first dental visit', 'pediatric dentist', 'child tooth decay', 'dental sealants', 'fluoride treatment'], 'informational', '/services/pediatric-dentistry'),
  ('Root Canal Treatment', 'root canal', ARRAY['root canal cost', 'root canal pain', 'root canal recovery', 'root canal vs extraction', 'endodontist'], 'informational', '/services/root-canal'),
  ('Oral Health & Prevention', 'oral health tips', ARRAY['brushing technique', 'flossing', 'mouthwash', 'dental checkup', 'gum disease prevention'], 'informational', '/blog'),
  ('Dental Costs & Financing', 'dental costs', ARRAY['dental payment plans', 'affordable dentist', 'dental financing', 'dental discount plans', 'dental costs without insurance'], 'commercial', '/tools/dental-cost-calculator');

-- Seed blog content templates
INSERT INTO public.blog_content_templates (name, description, category, content_structure, target_word_count, seo_guidelines, example_titles) VALUES
  (
    'Ultimate Guide',
    'Comprehensive pillar page covering a topic end-to-end. Best for high-volume keywords.',
    'pillar',
    '[{"type":"intro","label":"Hook + Topic Overview","word_count":200},{"type":"section","label":"What Is [Topic]?","word_count":300},{"type":"section","label":"Types / Options","word_count":400},{"type":"section","label":"Procedure / How It Works","word_count":300},{"type":"section","label":"Cost & Insurance","word_count":250},{"type":"section","label":"Pros & Cons","word_count":200},{"type":"faq","label":"FAQ Section (5-8 questions)","word_count":400},{"type":"cta","label":"Next Steps CTA","word_count":100}]',
    2500,
    'Target primary keyword in H1, URL, and first 100 words. Use LSI keywords in H2s. Include at least 2 internal links per section.',
    ARRAY['The Ultimate Guide to Dental Implants in 2026', 'Complete Guide to Teeth Whitening: Options, Costs & Results', 'Everything You Need to Know About Invisalign']
  ),
  (
    'Cost Breakdown',
    'Price-focused article targeting commercial intent keywords. Includes comparisons and insurance info.',
    'commercial',
    '[{"type":"intro","label":"Cost Overview + Quick Answer","word_count":150},{"type":"table","label":"Cost Comparison Table","word_count":100},{"type":"section","label":"Factors Affecting Cost","word_count":300},{"type":"section","label":"Insurance Coverage","word_count":250},{"type":"section","label":"Financing Options","word_count":200},{"type":"section","label":"How to Save Money","word_count":200},{"type":"faq","label":"Cost FAQ (4-6 questions)","word_count":300},{"type":"cta","label":"Get a Quote CTA","word_count":100}]',
    1500,
    'Include exact cost ranges in meta description. Use schema markup for FAQ. Target "[procedure] cost" keywords.',
    ARRAY['How Much Do Dental Implants Cost in 2026?', 'Invisalign Cost: Complete Price Guide by State', 'Root Canal Cost: What to Expect With & Without Insurance']
  ),
  (
    'Comparison Article',
    'Side-by-side comparison of treatments, products, or options. High conversion potential.',
    'commercial',
    '[{"type":"intro","label":"Comparison Overview","word_count":150},{"type":"table","label":"Quick Comparison Table","word_count":100},{"type":"section","label":"Option A: Deep Dive","word_count":300},{"type":"section","label":"Option B: Deep Dive","word_count":300},{"type":"section","label":"Key Differences","word_count":200},{"type":"section","label":"Which Is Right for You?","word_count":200},{"type":"faq","label":"Comparison FAQ","word_count":250},{"type":"cta","label":"Consult a Dentist CTA","word_count":100}]',
    1500,
    'Use "vs" in title and URL. Include comparison table early. Target both option keywords.',
    ARRAY['Invisalign vs Braces: Which Is Better in 2026?', 'Dental Implants vs Dentures: Complete Comparison', 'Veneers vs Bonding: Cost, Durability & Results']
  ),
  (
    'How-To / Patient Guide',
    'Step-by-step patient education content. Builds trust and targets informational queries.',
    'informational',
    '[{"type":"intro","label":"Why This Matters","word_count":150},{"type":"section","label":"Before Your Visit","word_count":250},{"type":"steps","label":"Step-by-Step Process","word_count":400},{"type":"section","label":"What to Expect After","word_count":250},{"type":"section","label":"Tips for Best Results","word_count":200},{"type":"faq","label":"Patient FAQ","word_count":300},{"type":"cta","label":"Book Appointment CTA","word_count":100}]',
    1500,
    'Use HowTo schema markup. Include numbered steps. Target "how to" and "what to expect" keywords.',
    ARRAY['How to Prepare for Your First Dental Implant', 'What to Expect During a Root Canal: Patient Guide', 'How to Choose the Right Dentist: 10 Steps']
  ),
  (
    'Local City Guide',
    'Location-specific dental content. Targets "[service] in [city]" keywords.',
    'local',
    '[{"type":"intro","label":"City Dental Overview","word_count":200},{"type":"section","label":"Top Dental Clinics in [City]","word_count":300},{"type":"section","label":"Average Costs in [City]","word_count":250},{"type":"section","label":"Insurance & Payment Options","word_count":200},{"type":"section","label":"Tips for Finding a Dentist","word_count":200},{"type":"faq","label":"Local FAQ","word_count":300},{"type":"cta","label":"Find Dentists in [City]","word_count":100}]',
    1500,
    'Include city name in H1, meta title, and 2-3 H2s. Link to local clinic profiles. Mention specific neighborhoods.',
    ARRAY['Best Dentists in Los Angeles: 2026 Guide', 'Finding Affordable Dental Care in Boston', 'Top-Rated Dental Clinics in San Francisco']
  );
