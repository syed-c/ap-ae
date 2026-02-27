'use client';
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { SearchBox } from "@/components/SearchBox";
import { DentistListFrame, LocationQuickLinks } from "@/components/location";
import { SEOContentBlock } from "@/components/seo/SEOContentBlock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useProfiles } from "@/hooks/useProfiles";
import { useServicePriceRanges } from "@/hooks/useServicePriceRanges";
import { useSeoPageContent, parseMarkdownContent, parseFaqFromContent } from "@/hooks/useSeoPageContent";
import { usePrerenderReady } from "@/hooks/usePrerenderReady";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Users,
  Star,
  Shield,
  MapPin,
  Stethoscope,
  DollarSign,
  BarChart3,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const MIN_PROFILE_COUNT = 2;

const ServicePage = () => {
  const { serviceSlug: serviceSlugParam } = useParams();
  const serviceSlug = serviceSlugParam || "";

  const seoSlug = `services/${serviceSlug}`;
  const { data: seoContent, isLoading: seoContentLoading, isFetching: seoContentFetching } = useSeoPageContent(seoSlug);
  const isSeoContentPending = !seoContent && (seoContentLoading || seoContentFetching);

  const { data: treatment, isLoading: treatmentLoading } = useQuery({
    queryKey: ["treatment", serviceSlug],
    queryFn: async () => {
      const { data } = await supabase.from("treatments").select("*").eq("slug", serviceSlug).maybeSingle();
      return data;
    },
  });

  const { data: relatedTreatments } = useQuery({
    queryKey: ["related-treatments", serviceSlug],
    queryFn: async () => {
      const { data } = await supabase.from("treatments").select("*").eq("is_active", true).neq("slug", serviceSlug).order("display_order").limit(6);
      return data || [];
    },
  });

  const { data: profiles, isLoading: profilesLoading } = useProfiles({ limit: 50 });

  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: async () => {
      const { data } = await supabase.from("states").select("*").eq("is_active", true).order("display_order");
      return data || [];
    },
  });

  // Price intelligence data
  const { data: priceRanges } = useServicePriceRanges(serviceSlug);

  const treatmentName = treatment?.name || serviceSlug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const parsedContent = seoContent?.content ? parseMarkdownContent(seoContent.content) : null;
  const seoFaqs = seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0
    ? seoContent.faqs
    : seoContent?.content ? parseFaqFromContent(seoContent.content) : [];

  const isDataReady = !treatmentLoading && !profilesLoading;
  usePrerenderReady(isDataReady);
  const shouldNoIndex = !profilesLoading && (!profiles || profiles.length < MIN_PROFILE_COUNT);

  // Price stats
  const uaeMin = priceRanges?.length ? Math.min(...priceRanges.map(r => r.price_min)) : 0;
  const uaeMax = priceRanges?.length ? Math.max(...priceRanges.map(r => r.price_max)) : 0;
  const sortedByPrice = [...(priceRanges || [])].sort((a, b) => a.price_min - b.price_min);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Dental Services", href: "/services" },
    { label: treatmentName },
  ];

  const faqs = seoFaqs.length > 0 ? seoFaqs.map(f => ({ q: f.question, a: f.answer })) : [
    {
      q: `How much does ${treatmentName} cost in the UAE?`,
      a: uaeMin > 0
        ? `${treatmentName} costs between AED ${uaeMin.toLocaleString()} and AED ${uaeMax.toLocaleString()} across the UAE. Prices vary by emirate, with ${sortedByPrice[0]?.state?.name || 'northern emirates'} offering the most affordable options. Visit our detailed cost guide for emirate-by-emirate pricing.`
        : `Costs vary by clinic and treatment needs. We recommend booking a consultation. Many clinics accept insurance and offer payment plans.`,
    },
    {
      q: `What is ${treatmentName}?`,
      a: treatment?.description || `${treatmentName} is a professional dental procedure designed to improve your oral health and smile. Our qualified dentists across all 7 UAE emirates use the latest techniques.`,
    },
    {
      q: `How do I find the best ${treatmentName} specialist in the UAE?`,
      a: `Use our directory to compare ${profiles?.length || 0}+ verified specialists across Dubai, Abu Dhabi, Sharjah and all emirates. Filter by rating, location, insurance acceptance, and budget to find your ideal match.`,
    },
    {
      q: `Does insurance cover ${treatmentName}?`,
      a: `Coverage depends on your insurance provider and plan. DHA-mandated basic plans typically cover preventive procedures, while enhanced plans may cover major treatments. Check with your provider or use our Insurance Checker tool.`,
    },
  ];

  const relatedServices = (relatedTreatments || []).map(t => ({ name: t.name, slug: t.slug }));

  return (
    <PageLayout>
      <SEOHead
        title={seoContent?.meta_title || `${treatmentName} in UAE — Find Specialists & Compare Prices`}
        description={seoContent?.meta_description || `Find the best ${treatmentName.toLowerCase()} specialists across the UAE. Compare prices from AED ${uaeMin.toLocaleString()}–${uaeMax.toLocaleString()}, check insurance coverage, and book verified clinics.`}
        canonical={`/services/${serviceSlug}/`}
        keywords={[`${treatmentName} UAE`, `${treatmentName} cost`, `${treatmentName} Dubai`, `best ${treatmentName} clinic UAE`]}
        noindex={shouldNoIndex}
      />
      <StructuredData
        type="service"
        name={`${treatmentName} in UAE`}
        description={treatment?.description || `Professional ${treatmentName} services across the UAE`}
        url={`/services/${serviceSlug}/`}
        provider="AppointPanda Partner Clinics"
        areaServed="United Arab Emirates"
      />
      <StructuredData type="faq" questions={faqs.map(f => ({ question: f.q, answer: f.a }))} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-emerald-light/30 to-background pt-6 pb-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-[10%] w-48 md:w-64 h-48 md:h-64 bg-foreground/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-10 right-[15%] w-56 md:w-80 h-56 md:h-80 bg-primary/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <div className="container relative z-10 px-4">
          <div className="flex justify-center mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-foreground/5 backdrop-blur-sm border border-foreground/10 rounded-full px-4 py-2 mb-4"
            >
              <Stethoscope className="h-4 w-4 text-emerald" />
              <span className="text-xs md:text-sm font-bold text-foreground/80">UAE Dental Service</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3 px-2"
            >
              {treatmentName} in <span className="text-primary">UAE</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto px-2"
            >
              {treatment?.description || `Find the best ${treatmentName.toLowerCase()} specialists across all 7 UAE emirates. Compare prices, check insurance coverage, and book verified clinics.`}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl md:max-w-2xl mx-auto mb-6"
            >
              <SearchBox variant="hero" />
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2"
            >
              <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">{profiles?.length || 0}+ Specialists</span>
              </div>
              {uaeMin > 0 && (
                <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">From AED {uaeMin.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm">
                <Star className="h-4 w-4 text-gold fill-gold" />
                <span className="font-bold text-sm">4.8 Avg. Rating</span>
              </div>
              <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-sm">
                <Shield className="h-4 w-4 text-emerald" />
                <span className="font-bold text-sm">Verified</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Services Quick Links - Text Based */}
      {relatedServices.length > 0 && (
        <section className="py-4 bg-muted/30 border-y border-border">
          <div className="container px-4">
            <LocationQuickLinks
              variant="services"
              items={relatedServices}
              title="Related Dental Treatments"
            />
          </div>
        </section>
      )}

      {/* Price by Emirate Section */}
      {sortedByPrice.length > 0 && (
        <Section size="lg" className="bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">Price Intelligence</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {treatmentName} Cost <span className="text-primary">by Emirate</span>
              </h2>
              <p className="text-muted-foreground mt-2">
                UAE-wide prices range from <strong className="text-primary">AED {uaeMin.toLocaleString()}</strong> to <strong className="text-primary">AED {uaeMax.toLocaleString()}</strong>
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              {sortedByPrice.map((range, i) => {
                const barWidth = uaeMax > 0 ? ((range.price_max - range.price_min) / uaeMax) * 100 : 50;
                const barLeft = uaeMax > 0 ? (range.price_min / uaeMax) * 100 : 0;
                return (
                  <motion.div
                    key={range.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Link to={`/${range.state?.slug}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-bold text-foreground">{range.state?.name}</span>
                      </Link>
                      <span className="font-bold text-primary">
                        AED {range.price_min.toLocaleString()} – {range.price_max.toLocaleString()}
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                        style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 5)}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center">
              <Link
                to={`/cost/${serviceSlug}`}
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
              >
                <BarChart3 className="h-4 w-4" />
                View detailed price guide & comparison
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Section>
      )}

      {/* Main Content */}
      <Section size="lg">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            <DentistListFrame
              profiles={profiles || []}
              isLoading={profilesLoading}
              locationName="UAE"
              emptyMessage="We're still adding specialists for this service."
              maxHeight={700}
              initialCount={6}
            />

            <SEOContentBlock
              variant="service"
              locationName="UAE"
              treatmentName={treatmentName}
              clinicCount={profiles?.length || 0}
              parsedContent={parsedContent}
              isLoading={isSeoContentPending}
            />
          </div>
        </div>
      </Section>

      {/* Find by Emirate — Text-based internal links */}
      {states && states.length > 0 && (
        <Section size="lg" className="bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <span className="inline-block text-xs font-bold text-emerald uppercase tracking-widest mb-2">By Location</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {treatmentName} Specialists <span className="text-primary">Across the UAE</span>
              </h2>
            </div>

            {/* Text-based paragraph with embedded links */}
            <div className="text-center text-muted-foreground leading-relaxed mb-6">
              <p>
                Looking for {treatmentName.toLowerCase()} specialists? Browse verified clinics across all 7 emirates: {states.map((state, i) => (
                  <span key={state.id}>
                    {i > 0 && (i === states.length - 1 ? ', and ' : ', ')}
                    <Link
                      to={`/${state.slug}`}
                      className="text-primary font-bold hover:underline"
                    >
                      {treatmentName} in {state.name}
                    </Link>
                  </span>
                ))}. Each emirate has licensed DHA, DOH, or MOHAP-certified practitioners offering quality dental care at competitive prices.
              </p>
            </div>

            {/* Emirate Comparison Links */}
            {sortedByPrice.length > 1 && (
              <div className="text-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Compare Prices</span>
                <div className="leading-loose">
                  {sortedByPrice.slice(0, -1).map((range, i) => {
                    const nextRange = sortedByPrice[i + 1];
                    if (!nextRange) return null;
                    return (
                      <span key={range.id}>
                        {i > 0 && <span className="text-muted-foreground mx-2">·</span>}
                        <Link
                          to={`/compare/${serviceSlug}/${range.state?.slug}-vs-${nextRange.state?.slug}`}
                          className="text-primary font-bold hover:underline text-sm"
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
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">Have Questions?</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left font-bold hover:no-underline py-4 text-sm md:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>
    </PageLayout>
  );
};

export default ServicePage;
