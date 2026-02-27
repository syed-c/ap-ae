import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useServicePriceRanges } from "@/hooks/useServicePriceRanges";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BarChart3, MapPin, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const EmirateComparisonPage = () => {
  const { serviceSlug, emirate1, emirate2 } = useParams();
  const slug = serviceSlug || "";

  const { data: treatment } = useQuery({
    queryKey: ["treatment-compare", slug],
    queryFn: async () => {
      const { data } = await supabase.from("treatments").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  const { data: priceRanges, isLoading } = useServicePriceRanges(slug);

  const treatmentName = treatment?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const emirate1Data = priceRanges?.find((r) => r.state?.slug === emirate1);
  const emirate2Data = priceRanges?.find((r) => r.state?.slug === emirate2);

  const emirate1Name = emirate1Data?.state?.name || (emirate1 || "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const emirate2Name = emirate2Data?.state?.name || (emirate2 || "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const priceDiff = emirate1Data && emirate2Data
    ? Math.round(((emirate1Data.price_min + emirate1Data.price_max) / 2) - ((emirate2Data.price_min + emirate2Data.price_max) / 2))
    : 0;
  const cheaperEmirate = priceDiff > 0 ? emirate2Name : emirate1Name;
  const savingsPercent = emirate1Data && emirate2Data
    ? Math.abs(Math.round((priceDiff / ((emirate1Data.price_min + emirate1Data.price_max) / 2)) * 100))
    : 0;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: `${treatmentName} Cost`, href: `/cost/${slug}` },
    { label: `${emirate1Name} vs ${emirate2Name}` },
  ];

  const faqs = [
    { q: `Is ${treatmentName} cheaper in ${emirate1Name} or ${emirate2Name}?`, a: `${cheaperEmirate} is generally more affordable for ${treatmentName.toLowerCase()}, with savings of approximately ${savingsPercent}%. However, prices can vary significantly between individual clinics.` },
    { q: `Should I travel to a different emirate for dental treatment?`, a: `If cost savings are significant (20%+), many UAE residents do travel between emirates for dental care. Consider the travel time, follow-up appointments, and whether you have insurance coverage at the destination clinic.` },
    { q: `Are dental standards the same across all emirates?`, a: `Yes. All dental clinics in the UAE must be licensed by their respective health authority (DHA for Dubai, DOH for Abu Dhabi, MOHAP for others). Standards of care and safety regulations are consistent nationwide.` },
  ];

  return (
    <PageLayout>
      <SEOHead
        title={`${treatmentName}: ${emirate1Name} vs ${emirate2Name} — Price Comparison 2026`}
        description={`Compare ${treatmentName.toLowerCase()} costs between ${emirate1Name} and ${emirate2Name}. See price ranges, coverage differences, and find the best value.`}
        canonical={`/compare/${slug}/${emirate1}-vs-${emirate2}/`}
        keywords={[`${treatmentName} ${emirate1Name}`, `${treatmentName} ${emirate2Name}`, `dental prices comparison UAE`]}
      />
      <StructuredData type="faq" questions={faqs.map((f) => ({ question: f.q, answer: f.a }))} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-8 pb-14">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10 px-4">
          <Breadcrumbs items={breadcrumbs} className="mb-6 [&_a]:text-white/60 [&_span]:text-white/40 [&_svg]:text-white/30" />
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="rounded-full px-4 py-2 text-sm font-bold mb-5 bg-primary/15 text-primary border-primary/30">
              <BarChart3 className="h-4 w-4 mr-2" /> Emirate Comparison
            </Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              {treatmentName} in <span className="text-primary">{emirate1Name}</span> vs <span className="text-primary">{emirate2Name}</span>
            </h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Side-by-side price comparison with market data for 2026
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-12 md:h-16" preserveAspectRatio="none">
            <path d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Comparison Cards */}
      <Section size="lg">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {[{ data: emirate1Data, name: emirate1Name, slug: emirate1 }, { data: emirate2Data, name: emirate2Name, slug: emirate2 }].map((emirate, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-border rounded-3xl p-7 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h2 className="font-display text-xl font-bold text-foreground">{emirate.name}</h2>
                    </div>
                    {emirate.data ? (
                      <>
                        <div className="text-4xl font-bold text-primary mb-2">
                          AED {emirate.data.price_min.toLocaleString()} – {emirate.data.price_max.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Average: AED {Math.round((emirate.data.price_min + emirate.data.price_max) / 2).toLocaleString()}
                        </p>
                        <Link
                          to={`/${emirate.slug}`}
                          className="inline-flex items-center gap-1 text-sm text-primary font-bold hover:underline"
                        >
                          Find clinics in {emirate.name} <ArrowRight className="h-3 w-3" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Price data not available</p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Verdict */}
              {emirate1Data && emirate2Data && (
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-7 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {priceDiff > 0 ? <TrendingDown className="h-5 w-5 text-emerald-500" /> : <TrendingUp className="h-5 w-5 text-emerald-500" />}
                    <h3 className="font-bold text-lg text-foreground">Price Verdict</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-primary">{cheaperEmirate}</strong> is approximately <strong>{savingsPercent}%</strong> more affordable for {treatmentName.toLowerCase()}. 
                    You could save around <strong className="text-primary">AED {Math.abs(priceDiff).toLocaleString()}</strong> on average by choosing {cheaperEmirate}. 
                    Both emirates have DHA/DOH/MOHAP licensed clinics ensuring quality standards.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      {/* Internal Links */}
      <Section size="lg" className="bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Compare Other <span className="text-primary">Emirates</span>
          </h2>
          <div className="leading-loose">
            {priceRanges?.filter(r => r.state?.slug !== emirate1 && r.state?.slug !== emirate2).map((range, i) => (
              <span key={range.id}>
                {i > 0 && <span className="text-muted-foreground mx-2">·</span>}
                <Link
                  to={`/compare/${slug}/${emirate1}-vs-${range.state?.slug}`}
                  className="text-primary font-bold hover:underline"
                >
                  {emirate1Name} vs {range.state?.name}
                </Link>
              </span>
            ))}
          </div>
          <div className="mt-4">
            <Link to={`/cost/${slug}`} className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              View all emirates <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section size="lg">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/30">
                <AccordionTrigger className="text-left font-bold hover:no-underline py-4 text-sm md:text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-sm">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>
    </PageLayout>
  );
};

export default EmirateComparisonPage;
