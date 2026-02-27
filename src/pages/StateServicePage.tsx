/**
 * StateServicePage - Emirate-level service page
 * Renders when URL is /{emirate}/{service}/ (e.g., /dubai/teeth-whitening/)
 * Shows all clinics offering that service across the entire emirate.
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { SearchBox } from "@/components/SearchBox";
import { DentistListFrame } from "@/components/location";
import { SEOHead } from "@/components/seo/SEOHead";
import { SyncStructuredData } from "@/components/seo/SyncStructuredData";
import { GeographicLinkBlock } from "@/components/seo/GeographicLinkBlock";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { useCitiesByStateSlug } from "@/hooks/useLocations";
import { usePrerenderReady } from "@/hooks/usePrerenderReady";
import { normalizeStateSlug } from "@/lib/slug/normalizeStateSlug";
import { useServicePriceRanges } from "@/hooks/useServicePriceRanges";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Users, Star, Clock, Stethoscope } from "lucide-react";

interface StateServicePageProps {
  stateSlug: string;
  serviceSlug: string;
  stateName: string;
  stateId: string;
  treatment: { id: string; name: string; slug: string; description?: string | null };
}

const StateServicePage = ({ stateSlug, serviceSlug, stateName, stateId, treatment }: StateServicePageProps) => {
  const normalizedStateSlug = normalizeStateSlug(stateSlug);
  const treatmentName = treatment.name;

  // Fetch cities for this state
  const { data: cities, isLoading: citiesLoading } = useCitiesByStateSlug(normalizedStateSlug || '');

  // Fetch price ranges for this service
  const { data: priceRanges } = useServicePriceRanges(serviceSlug);

  // Fetch clinics offering this service across the state
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['state-service-profiles', stateId, treatment.id],
    queryFn: async () => {
      // Get city IDs for this state
      const { data: stateCities } = await supabase
        .from('cities')
        .select('id')
        .eq('state_id', stateId)
        .eq('is_active', true);

      if (!stateCities?.length) return [];
      const cityIds = stateCities.map(c => c.id);

      // Get clinics in these cities
      const { data: clinics } = await supabase
        .from('clinics')
        .select(`
          id, name, slug, description, cover_image_url, rating, review_count,
          address, phone, verification_status, claim_status,
          city:cities(name, slug, state:states(name, abbreviation))
        `)
        .in('city_id', cityIds)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(50);

      return (clinics || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: 'clinic' as const,
        specialty: treatmentName,
        location: c.city ? `${c.city.name}, ${c.city.state?.name || ''}` : '',
        rating: c.rating || 0,
        reviewCount: c.review_count || 0,
        image: c.cover_image_url,
        isVerified: c.verification_status === 'verified',
        isClaimed: c.claim_status === 'claimed',
        isPinned: false,
      }));
    },
    enabled: !!stateId && !!treatment.id,
  });

  const isDataReady = !profilesLoading && !citiesLoading;
  usePrerenderReady(isDataReady, { delay: 600 });

  const pageTitle = `${treatmentName} in ${stateName} - Best Clinics & Prices (AED)`;
  const pageDescription = `Find the best ${treatmentName.toLowerCase()} clinics in ${stateName}. Compare ${profiles?.length || 0}+ verified providers, prices in AED, and book appointments online.`;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: stateName, href: `/${normalizedStateSlug}/` },
    { label: treatmentName },
  ];

  // Get price range for this emirate
  const emiratePrice = priceRanges?.find(p => {
    const state = (p as any).state;
    return state?.slug === normalizedStateSlug;
  });

  const faqs = [
    {
      q: `How much does ${treatmentName} cost in ${stateName}?`,
      a: emiratePrice
        ? `${treatmentName} in ${stateName} typically costs between AED ${(emiratePrice as any).min_price?.toLocaleString()} and AED ${(emiratePrice as any).max_price?.toLocaleString()}. Prices vary by clinic, location, and complexity.`
        : `${treatmentName} costs in ${stateName} vary by clinic and complexity. We recommend booking a consultation for an accurate AED quote.`,
    },
    {
      q: `Where can I find ${treatmentName} specialists in ${stateName}?`,
      a: `We list ${profiles?.length || 0}+ verified ${treatmentName.toLowerCase()} specialists across ${stateName}. Browse our directory above to compare ratings and book appointments.`,
    },
    {
      q: `Does insurance cover ${treatmentName} in ${stateName}?`,
      a: `Many dental insurance plans in the UAE cover ${treatmentName.toLowerCase()} partially or fully. Coverage varies by provider — use our insurance filter to check compatibility.`,
    },
    {
      q: `How do I choose the best ${treatmentName} clinic in ${stateName}?`,
      a: `Compare clinic ratings, patient reviews, pricing, and insurance acceptance. Look for the "Verified" badge for extra assurance of quality.`,
    },
  ];

  const cityLinks = (cities || []).slice(0, 15).map(c => ({
    name: c.name,
    slug: c.slug,
  }));

  return (
    <PageLayout>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`/${normalizedStateSlug}/${serviceSlug}/`}
        keywords={[`${treatmentName} ${stateName}`, `${treatmentName} cost ${stateName}`, `best ${treatmentName} clinic ${stateName}`]}
      />
      <SyncStructuredData
        data={[
          {
            type: 'breadcrumb',
            items: [
              { name: 'Home', url: '/' },
              { name: stateName, url: `/${normalizedStateSlug}/` },
              { name: treatmentName, url: `/${normalizedStateSlug}/${serviceSlug}/` },
            ],
          },
          {
            type: 'faq',
            questions: faqs.map(f => ({ question: f.q, answer: f.a })),
          },
          {
            type: 'service',
            name: `${treatmentName} in ${stateName}`,
            description: pageDescription,
            url: `/${normalizedStateSlug}/${serviceSlug}/`,
            provider: 'AppointPanda',
            areaServed: stateName,
          },
        ]}
        id="state-service-schema"
      />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[45vh] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-teal/10 rounded-full blur-[100px]" />
        </div>

        <div className="container relative z-10 py-14 md:py-18 px-4">
          <div className="flex justify-center mb-4">
            <Breadcrumbs items={breadcrumbs} className="[&_a]:text-white/60 [&_span]:text-white/40 [&_svg]:text-white/30" />
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-xs md:text-sm font-bold mb-4 bg-primary/15 text-primary border-primary/30 backdrop-blur-md">
                <Stethoscope className="h-3 w-3 md:h-4 md:w-4 mr-1.5" />
                {stateName} Specialists
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 px-2"
              style={{ fontFamily: "'Varela Round', system-ui, sans-serif" }}
            >
              <span className="text-white">{treatmentName} in </span>
              <span className="text-primary">{stateName}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base lg:text-lg text-white/40 max-w-2xl mx-auto mb-5 px-2"
            >
              Compare {profiles?.length || 0}+ verified {treatmentName.toLowerCase()} clinics across {stateName}.
              {emiratePrice && (emiratePrice as any).min_price && (emiratePrice as any).max_price && ` Prices range from AED ${(emiratePrice as any).min_price?.toLocaleString()} to AED ${(emiratePrice as any).max_price?.toLocaleString()}.`}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl md:max-w-2xl mx-auto mb-5"
            >
              <SearchBox variant="hero" stateSlug={stateSlug} defaultTreatment={serviceSlug} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2"
            >
              <div className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-white">{profiles?.length || 0}+ Clinics</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
                <Star className="h-4 w-4 text-gold fill-gold" />
                <span className="font-bold text-sm text-white">4.8 Avg. Rating</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-white">Book in 60s</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-12 md:h-16" preserveAspectRatio="none">
            <path d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Intro Content */}
      <Section size="md">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground leading-relaxed">
            Looking for <strong>{treatmentName.toLowerCase()}</strong> in {stateName}? Our directory features {profiles?.length || 0}+ verified dental clinics offering {treatmentName.toLowerCase()} across {stateName}. 
            Compare prices, read patient reviews, and book your appointment online. Whether you're in{' '}
            {cityLinks.slice(0, 3).map((c, i) => (
              <span key={c.slug}>
                <Link to={`/${normalizedStateSlug}/${c.slug}/${serviceSlug}/`} className="text-primary hover:underline font-medium">{c.name}</Link>
                {i < 2 ? (i === 1 ? ', or ' : ', ') : ''}
              </span>
            ))}
            {cityLinks.length > 3 ? ` — we cover ${cityLinks.length}+ areas across ${stateName}.` : `.`}
          </p>
        </div>
      </Section>

      {/* Clinic Listings */}
      <Section size="lg">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            <DentistListFrame
              profiles={profiles || []}
              isLoading={profilesLoading}
              locationName={stateName}
              emptyMessage={`We're adding ${treatmentName.toLowerCase()} specialists in ${stateName}. Check back soon!`}
              maxHeight={700}
              initialCount={10}
            />
          </div>
        </div>
      </Section>

      {/* Browse by Area */}
      {cityLinks.length > 0 && (
        <Section size="md">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              <span className="text-primary">{treatmentName}</span> by Area in {stateName}
            </h2>
            <p className="text-muted-foreground mb-6">
              Find {treatmentName.toLowerCase()} clinics in specific areas across {stateName}:
            </p>
            <div className="flex flex-wrap gap-x-1 gap-y-1.5">
              {cityLinks.map((city, i) => (
                <span key={city.slug}>
                  <Link
                    to={`/${normalizedStateSlug}/${city.slug}/${serviceSlug}/`}
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                  >
                    {treatmentName} in {city.name}
                  </Link>
                  {i < cityLinks.length - 1 && <span className="text-muted-foreground mx-1.5">·</span>}
                </span>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Geographic Link Block */}
      <Section size="md">
        <div className="max-w-5xl mx-auto">
          <GeographicLinkBlock
            pageType="state"
            stateSlug={normalizedStateSlug || ''}
            stateName={stateName}
            topCities={cityLinks.slice(0, 8)}
            services={[]}
          />
        </div>
      </Section>

      {/* FAQ */}
      <Section size="lg" className="bg-muted/30">
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

export default StateServicePage;
