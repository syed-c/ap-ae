'use client';
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabaseAdmin } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { DentistListFrame } from "@/components/location";
import { SEOContentBlock } from "@/components/seo/SEOContentBlock";
import { PageIntroSection } from "@/components/seo/PageIntroSection";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useProfiles } from "@/hooks/useProfiles";
import { useServicePriceRanges } from "@/hooks/useServicePriceRanges";
import { useStates } from "@/hooks/useLocations";
import { parseMarkdownContent } from "@/hooks/useSeoPageContent";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Target,
  Heart,
  Shield,
  Users,
  Award,
  CheckCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Building2,
  Sparkles,
  Globe,
  TrendingUp,
  Star,
  MapPin,
  BarChart3,
} from "lucide-react";

interface ServicePageProps {
  serviceSlugProp?: string;
  seoDataProp?: {
    title: string;
    description: string;
    canonical: string;
  };
  h1Prop?: string | null;
  heroIntroProp?: string | null;
  contentProp?: string | null;
  faqsProp?: { question: string; answer: string }[];
  aiDefinitionProp?: string | null;
  aiProcessStepsProp?: { step: number; title: string; description: string }[] | null;
  aiCostRangeProp?: { treatment: string; min_aed: number; max_aed: number; notes: string }[] | null;
  aiChecklistProp?: { criteria: string; applies: boolean; description: string }[] | null;
}

const ServicePage = ({ serviceSlugProp, seoDataProp, h1Prop, heroIntroProp, contentProp, faqsProp, aiDefinitionProp, aiProcessStepsProp, aiCostRangeProp, aiChecklistProp }: ServicePageProps = {}) => {
  const router = useRouter();
  const serviceSlug = serviceSlugProp || (typeof router.query?.serviceSlug === 'string' ? router.query.serviceSlug : '');

  const seoSlug = `services/${serviceSlug}`;

  // SSR data from getStaticProps
  const serverTitle = seoDataProp?.title || '';
  const serverDescription = seoDataProp?.description || '';
  const serverCanonical = seoDataProp?.canonical || `/services/${serviceSlug}/`;
  const serverH1 = h1Prop;
  const serverHeroIntro = heroIntroProp || null;
  const serverContent = contentProp || null;
  const serverFaqs = faqsProp || [];
  const serverAiDefinition = aiDefinitionProp || null;
  const serverAiProcessSteps = aiProcessStepsProp || null;
  const serverAiCostRange = aiCostRangeProp || null;
  const serverAiChecklist = aiChecklistProp || null;

  console.log('[Client] serverTitle:', serverTitle?.substring(0, 40));
  console.log('[Client] serverH1:', serverH1?.substring(0, 40));
  console.log('[Client] serverHeroIntro:', serverHeroIntro?.substring(0, 50));
  console.log('[Client] serverContent:', serverContent?.substring(0, 50));
  console.log('[Client] serverFaqs count:', serverFaqs.length);

  // Fetch treatment data
  const { data: treatment } = useQuery({
    queryKey: ["treatment", serviceSlug],
    queryFn: async () => {
      const { data } = await supabaseAdmin.from("treatments").select("*").eq("slug", serviceSlug).maybeSingle();
      return data;
    },
  });

  // Fetch related treatments
  const { data: relatedTreatments } = useQuery({
    queryKey: ["related-treatments", serviceSlug],
    queryFn: async () => {
      const { data } = await supabaseAdmin.from("treatments").select("*").eq("is_active", true).neq("slug", serviceSlug).order("display_order").limit(6);
      return data || [];
    },
  });

  // Fetch profiles
  const { data: profiles, isLoading: profilesLoading } = useProfiles({ limit: 50 });

  // Fetch states
  const { data: states } = useStates();

  // Fetch price ranges
  const { data: priceRanges } = useServicePriceRanges(serviceSlug);

  const treatmentName = treatment?.name || serviceSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  // For meta tags: Use SSR data if available (guaranteed), fallback to treatment name
  const metaTitle = serverTitle || `${treatmentName} in UAE — Find Specialists & Compare Prices`;
  const metaDescription = serverDescription || `Find the best ${treatmentName.toLowerCase()} specialists across the UAE. Book appointments with verified dentists.`;

  // For UI: Use SSR content or defaults
  const displayH1 = serverH1 || `Best ${treatmentName} in UAE — Verified Specialists`;
  const displayIntro = serverHeroIntro || treatment?.description || null;
  const displayContent = serverContent || null;
  
  console.log('[ServicePage] displayH1:', displayH1?.substring(0, 40));
  console.log('[ServicePage] displayIntro length:', displayIntro?.length);
  console.log('[ServicePage] displayContent length:', displayContent?.length);
  
  const parsedContent = displayContent ? parseMarkdownContent(displayContent) : null;

  // Price data
  const sortedByPrice = [...(priceRanges || [])].sort((a, b) => a.price_min - b.price_min);
  const minPrice = sortedByPrice.length > 0 ? Math.min(...sortedByPrice.map(r => r.price_min)) : 0;
  const maxPrice = sortedByPrice.length > 0 ? Math.max(...sortedByPrice.map(r => r.price_max)) : 0;

  // FAQs - prefer SSR data
  const faqs = serverFaqs.length > 0 ? serverFaqs : [
    {
      q: `How much does ${treatmentName} cost in the UAE?`,
      a: minPrice > 0
        ? `${treatmentName} costs between AED ${minPrice.toLocaleString()} and AED ${maxPrice.toLocaleString()} across the UAE. Prices vary by emirate.`
        : `Costs vary by clinic and treatment needs. We recommend booking a consultation.`,
    },
    {
      q: `What is ${treatmentName}?`,
      a: treatment?.description || `${treatmentName} is a professional dental procedure performed by certified specialists.`,
    },
    {
      q: `How do I find the best ${treatmentName} specialist in the UAE?`,
      a: `Use our directory to compare verified specialists across Dubai, Abu Dhabi, and all emirates. All dentists are DHA/DOH/MOHAP certified.`,
    },
    {
      q: `Does insurance cover ${treatmentName}?`,
      a: `Coverage depends on your insurance provider and plan. Many clinics offer flexible payment plans.`,
    },
  ];

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Dental Services", href: "/services" },
    { label: treatmentName },
  ];

  return (
    <PageLayout>
      {/* SEO Meta Tags - using SSR data */}
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        canonical={serverCanonical}
        keywords={[`${treatmentName} UAE`, `${treatmentName} cost`, `${treatmentName} Dubai`, `best ${treatmentName} clinic UAE`]}
      />
      
      <StructuredData
        type="service"
        name={`${treatmentName} in UAE`}
        description={treatment?.description || `Professional ${treatmentName} services across the UAE`}
        url={serverCanonical}
        provider="AppointPanda Partner Clinics"
        areaServed="United Arab Emirates"
      />
      <StructuredData
        type="breadcrumb"
        items={[
          { name: 'Home', url: '/' },
          { name: 'Services', url: '/services/' },
          { name: treatmentName, url: serverCanonical },
        ]}
      />
      <StructuredData
        type="medicalProcedure"
        name={treatmentName}
        description={treatment?.description || `Professional ${treatmentName} services across the UAE`}
        url={serverCanonical}
        procedureType="Dental Procedure"
        bodyLocation="Oral cavity"
        followup="Regular dental checkups recommended every 6 months"
        preparation="Initial consultation and dental examination required"
        recognizingAuthority={[
          { name: "Dubai Health Authority (DHA)", url: "https://www.dha.gov.ae" },
          { name: "Department of Health - Abu Dhabi (DOH)", url: "https://www.doh.gov.ae" },
          { name: "Ministry of Health and Prevention (MOHAP)", url: "https://www.mohap.gov.ae" },
        ]}
      />
      <StructuredData
        type="breadcrumb"
        items={[
          { name: 'Home', url: '/' },
          { name: 'Services', url: '/services/' },
          { name: treatmentName, url: serverCanonical },
        ]}
      />
      <StructuredData 
        type="faq" 
        questions={faqs.map(f => ({ question: f.question, answer: f.answer })).filter(f => f.question && f.answer)}
        includeSpeakable={true}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-emerald-50/50 to-background pt-8 pb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          />
        </div>

        <div className="container relative z-10 px-4">
          <div className="flex justify-center mb-6">
            <Breadcrumbs items={breadcrumbs} />
          </div>

          <div className="max-w-4xl mx-auto text-center">
            {/* Price Cards */}
            {sortedByPrice.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
              >
                {sortedByPrice.slice(0, 6).map((range, i) => (
                  <motion.div
                    key={range.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <Link href={`/${range.state?.slug}/`} className="font-semibold text-gray-800 hover:text-emerald-700 transition-colors">
                        {range.state?.name}
                      </Link>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-emerald-700">
                        AED {range.price_min.toLocaleString()}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className="text-2xl font-bold text-emerald-700">
                        {range.price_max.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Price CTA */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/services/${serviceSlug}/`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <BarChart3 className="h-5 w-5" />
                View Full Price Guide
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Stats */}
            {profiles && profiles.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-6 mt-8"
              >
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span><strong className="text-gray-900">{profiles.length}</strong> verified specialists</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span><strong className="text-gray-900">4.8+</strong> average rating</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  <span>All <strong className="text-gray-900">7 emirates</strong></span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Page Intro - H1 + hero intro paragraph */}
      <PageIntroSection
        title={displayH1}
        content={displayIntro}
      />

      {/* AI-Optimized Structured Content Section */}
      {serverAiDefinition && (
        <Section size="lg">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">About This Treatment</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                What is <span className="text-emerald-600">{treatmentName}</span>?
              </h2>
            </div>
            
            {/* AI Definition - direct answer for AI extraction */}
            <div className="ai-definition bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 md:p-8 mb-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                {serverAiDefinition}
              </p>
            </div>

            {/* Process Steps - Numbered for AI */}
            {serverAiProcessSteps && serverAiProcessSteps.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm">✓</span>
                  Treatment Process
                </h3>
                <div className="space-y-4">
                  {serverAiProcessSteps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{step.title}</h4>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Range Table - AED prices */}
            {serverAiCostRange && serverAiCostRange.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm">₿</span>
                  Cost Range (AED)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white border border-gray-200 rounded-xl">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Treatment</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Min (AED)</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Max (AED)</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverAiCostRange.map((cost, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-4 py-3 text-gray-800">{cost.treatment}</td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">{cost.min_aed.toLocaleString()}</td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">{cost.max_aed.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-500 text-sm">{cost.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Checklist - Is it right for me? */}
            {serverAiChecklist && serverAiChecklist.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm">?</span>
                  Is It Right For Me?
                </h3>
                <div className="space-y-3">
                  {serverAiChecklist.map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${item.applies ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      {item.applies ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className={`font-semibold ${item.applies ? 'text-green-800' : 'text-red-800'}`}>
                          {item.criteria}
                        </span>
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Dentist List */}
      <Section size="lg">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            <DentistListFrame
              profiles={profiles || []}
              isLoading={profilesLoading}
              locationName="UAE"
              emptyMessage="We're still adding specialists for this service."
              maxHeight={700}
              initialCount={6}
            />
          </div>
        </div>
      </Section>

      {/* SEO Content - full body content */}
      <Section size="lg">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <SEOContentBlock
              variant="service"
              locationName="UAE"
              treatmentName={treatmentName}
              clinicCount={profiles?.length || 0}
              parsedContent={parsedContent}
            />
          </div>
        </div>
      </Section>

      {/* Find by Location */}
      {states && states.length > 0 && (
        <Section size="lg" className="bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">By Location</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {treatmentName} in <span className="text-emerald-600">Every Emirate</span>
              </h2>
            </div>

            <div className="text-center text-gray-600 leading-relaxed mb-8">
              <p>
                Find verified {treatmentName.toLowerCase()} specialists in all 7 emirates:{' '}
                {states.map((state, i) => (
                  <span key={state.id}>
                    {i > 0 && (i === states.length - 1 ? ', and ' : ', ')}
                    <Link href={`/${state.slug}/`} className="text-emerald-600 font-semibold hover:text-emerald-700 hover:underline">
                      {state.name}
                    </Link>
                  </span>
                ))}
              </p>
            </div>

            {sortedByPrice.length > 1 && (
              <div className="text-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Compare Prices</span>
                <div className="flex flex-wrap justify-center gap-3">
                  {sortedByPrice.slice(0, -1).map((range, i) => {
                    const nextRange = sortedByPrice[i + 1];
                    if (!nextRange) return null;
                    return (
                      <span key={range.id}>
                        <Link
                          href={`/compare/${serviceSlug}/${range.state?.slug}-vs-${nextRange.state?.slug}/`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                        >
                          {range.state?.name} vs {nextRange.state?.name}
                        </Link>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* FAQ Section */}
      <Section size="lg">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">FAQ</span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Frequently Asked <span className="text-emerald-600">Questions</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <AccordionItem value={`faq-${i}`} className="border-0">
                    <AccordionTrigger className="text-left font-semibold text-gray-800 hover:no-underline px-6 py-4 hover:bg-gray-50 transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="faq-answer text-gray-600 px-6 pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Clinical References - E-E-A-T Signal */}
      <Section size="md" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">Sources & References</span>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Clinical References</h2>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-medium shrink-0">[1]</span>
                <span>Dubai Health Authority (DHA). <em>Dental Treatment Guidelines & Protocols</em>. Available at: <a href="https://www.dha.gov.ae" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">dha.gov.ae</a></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-medium shrink-0">[2]</span>
                <span>World Health Organization (WHO). <em>Oral Health Fact Sheets</em>. Available at: <a href="https://www.who.int/news-room/fact-sheets/detail/oral-health" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">who.int</a></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-medium shrink-0">[3]</span>
                <span>American Dental Association (ADA). <em>Dental Clinical Guidelines</em>. Available at: <a href="https://www.ada.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ada.org</a></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-medium shrink-0">[4]</span>
                <span>Department of Health - Abu Dhabi (DOH). <em>Healthcare Standards & Regulations</em>. Available at: <a href="https://www.doh.gov.ae" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">doh.gov.ae</a></span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Content reviewed by licensed dental professionals.
            </p>
          </div>
        </div>
      </Section>

      {/* Related Services */}
      {relatedTreatments && relatedTreatments.length > 0 && (
        <Section size="lg" className="bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Explore More</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Related <span className="text-emerald-600">Dental Services</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTreatments.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/services/${t.slug}/`}
                    className="block p-6 bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{t.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{t.description}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </PageLayout>
  );
};

export default ServicePage;
