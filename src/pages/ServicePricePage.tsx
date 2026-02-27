import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SearchBox } from "@/components/SearchBox";
import { useServicePriceRanges } from "@/hooks/useServicePriceRanges";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DollarSign, TrendingUp, MapPin, Shield, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const ServicePricePage = () => {
  const { serviceSlug } = useParams();
  const slug = serviceSlug || "";

  const { data: treatment } = useQuery({
    queryKey: ["treatment-price", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("treatments")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return data;
    },
  });

  const { data: priceRanges, isLoading } = useServicePriceRanges(slug);

  const { data: relatedTreatments } = useQuery({
    queryKey: ["related-treatments-price", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("treatments")
        .select("id, name, slug")
        .eq("is_active", true)
        .neq("slug", slug)
        .order("display_order")
        .limit(8);
      return data || [];
    },
  });

  const treatmentName = treatment?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // Calculate UAE-wide stats
  const uaeMin = priceRanges?.length ? Math.min(...priceRanges.map((r) => r.price_min)) : 0;
  const uaeMax = priceRanges?.length ? Math.max(...priceRanges.map((r) => r.price_max)) : 0;
  const uaeAvg = priceRanges?.length ? Math.round(priceRanges.reduce((sum, r) => sum + (r.price_min + r.price_max) / 2, 0) / priceRanges.length) : 0;

  // Sort by cheapest
  const sortedByPrice = [...(priceRanges || [])].sort((a, b) => a.price_min - b.price_min);
  const cheapestEmirate = sortedByPrice[0]?.state?.name || "N/A";

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: treatmentName, href: `/services/${slug}` },
    { label: "Cost in UAE" },
  ];

  const faqs = [
    { q: `How much does ${treatmentName} cost in the UAE?`, a: `${treatmentName} costs range from AED ${uaeMin.toLocaleString()} to AED ${uaeMax.toLocaleString()} across the UAE. The average cost is approximately AED ${uaeAvg.toLocaleString()}. Prices vary significantly between emirates, with ${cheapestEmirate} generally offering the most affordable options.` },
    { q: `Why do ${treatmentName} prices differ between emirates?`, a: `Price differences are driven by clinic overhead costs (rent, staff salaries), competition density, and premium positioning. Dubai and Abu Dhabi tend to have higher prices due to premium clinic infrastructure, while Sharjah, Ajman, and northern emirates offer more competitive rates.` },
    { q: `Does insurance cover ${treatmentName} in the UAE?`, a: `Coverage varies by insurance provider and plan type. Basic plans may cover preventive treatments like cleanings at 80-100%, while cosmetic procedures like whitening or veneers typically have limited or no coverage. Check with your specific insurance provider for details.` },
    { q: `How can I find the best price for ${treatmentName}?`, a: `Compare prices across emirates using our price comparison tool. Consider clinics in Sharjah or Ajman if you're budget-conscious — many offer the same quality at 20-35% less than Dubai. Always verify the clinic is DHA/DOH/MOHAP licensed regardless of price.` },
    { q: `What factors affect the cost of ${treatmentName}?`, a: `Key factors include: clinic location (emirate and area), dentist experience and specialization, technology used (digital scanners, laser equipment), materials quality, and whether additional procedures are needed. Premium areas like DIFC or Palm Jumeirah typically charge 20-40% more.` },
  ];

  return (
    <PageLayout>
      <SEOHead
        title={`${treatmentName} Cost in UAE 2026 — Price Guide by Emirate`}
        description={`${treatmentName} costs AED ${uaeMin.toLocaleString()}–${uaeMax.toLocaleString()} in the UAE. Compare prices across Dubai, Abu Dhabi, Sharjah & all 7 emirates. Find affordable clinics near you.`}
        canonical={`/cost/${slug}/`}
        keywords={[`${treatmentName} cost UAE`, `${treatmentName} price Dubai`, `${treatmentName} cost Sharjah`, `cheap ${treatmentName} UAE`]}
      />
      <StructuredData type="faq" questions={faqs.map((f) => ({ question: f.q, answer: f.a }))} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-8 pb-14">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-teal/10 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10 px-4">
          <Breadcrumbs items={breadcrumbs} className="mb-6 [&_a]:text-white/60 [&_span]:text-white/40 [&_svg]:text-white/30" />
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="rounded-full px-4 py-2 text-sm font-bold mb-5 bg-primary/15 text-primary border-primary/30">
              <BarChart3 className="h-4 w-4 mr-2" /> Price Intelligence
            </Badge>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              {treatmentName} Cost in <span className="text-primary">UAE</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-6">
              Compare {treatmentName.toLowerCase()} prices across all 7 emirates. Updated for 2026 with real market data.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-3">
                <span className="text-xs text-white/40 block">UAE Range</span>
                <span className="font-bold text-white">AED {uaeMin.toLocaleString()} – {uaeMax.toLocaleString()}</span>
              </div>
              <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-3">
                <span className="text-xs text-white/40 block">Average</span>
                <span className="font-bold text-primary">AED {uaeAvg.toLocaleString()}</span>
              </div>
              <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-3">
                <span className="text-xs text-white/40 block">Most Affordable</span>
                <span className="font-bold text-emerald-400">{cheapestEmirate}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-12 md:h-16" preserveAspectRatio="none">
            <path d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Search */}
      <Section size="md">
        <div className="max-w-3xl mx-auto">
          <SearchBox variant="default" />
        </div>
      </Section>

      {/* Price Comparison Table */}
      <Section size="lg">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
            {treatmentName} Price <span className="text-primary">by Emirate</span>
          </h2>
          <p className="text-center text-muted-foreground mb-8">Estimated cost ranges based on 2026 UAE market data</p>

          {isLoading ? (
            <div className="space-y-3">{[...Array(7)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : (
            <div className="space-y-3">
              {sortedByPrice.map((range, i) => {
                const barWidth = uaeMax > 0 ? ((range.price_max - range.price_min) / uaeMax) * 100 : 50;
                const barLeft = uaeMax > 0 ? (range.price_min / uaeMax) * 100 : 0;
                return (
                  <motion.div
                    key={range.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Link
                        to={`/${range.state?.slug}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-bold text-foreground">{range.state?.name}</span>
                      </Link>
                      <div className="text-right">
                        <span className="font-bold text-primary text-lg">
                          AED {range.price_min.toLocaleString()} – {range.price_max.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                        style={{ left: `${barLeft}%`, width: `${Math.max(barWidth, 5)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">AED {range.price_min.toLocaleString()}</span>
                      <Link
                        to={`/${range.state?.slug}/${slug ? '' : ''}`.replace(/\/$/, '')}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Find clinics in {range.state?.name} →
                      </Link>
                      <span className="text-xs text-muted-foreground">AED {range.price_max.toLocaleString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      {/* What Affects Cost */}
      <Section size="lg" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            What Affects {treatmentName} <span className="text-primary">Cost?</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: MapPin, title: "Location & Emirate", desc: `Clinics in Dubai and Abu Dhabi typically charge 20-35% more than those in Sharjah or Ajman due to higher operational costs. Even within Dubai, areas like DIFC command premium pricing compared to Deira or Al Quoz.` },
              { icon: Shield, title: "Dentist Experience", desc: `Specialists with 15+ years of experience or international certifications (e.g., American Board certified) may charge more. However, this often comes with higher success rates and better outcomes.` },
              { icon: TrendingUp, title: "Technology & Materials", desc: `Clinics using advanced technology like 3D scanning, CAD/CAM, or laser equipment tend to charge more but offer more precise and comfortable treatments with faster recovery times.` },
              { icon: DollarSign, title: "Insurance Coverage", desc: `Your insurance plan can significantly reduce out-of-pocket costs. DHA-mandated basic plans cover preventive care, while enhanced plans may cover up to 80% of major procedures.` },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* How to Reduce Cost */}
      <Section size="lg">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            How to <span className="text-primary">Save Money</span> on {treatmentName}
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Finding affordable {treatmentName.toLowerCase()} in the UAE doesn't mean compromising on quality. Here are proven strategies to reduce your dental costs:
            </p>
            <p>
              <strong className="text-foreground">Consider nearby emirates.</strong> If you live in Dubai, clinics in{" "}
              <Link to="/sharjah" className="text-primary font-bold hover:underline">Sharjah</Link> and{" "}
              <Link to="/ajman" className="text-primary font-bold hover:underline">Ajman</Link> often offer the same treatments at 20-35% lower prices. Many residents make the short drive for significant savings on procedures like{" "}
              <Link to={`/services/${slug}`} className="text-primary font-bold hover:underline">{treatmentName.toLowerCase()}</Link>.
            </p>
            <p>
              <strong className="text-foreground">Maximize your insurance.</strong> Contact your insurance provider to understand your{" "}
              <Link to="/insurance" className="text-primary font-bold hover:underline">dental coverage</Link> before booking. Some plans cover up to 80% of treatment costs. Our{" "}
              <Link to="/tools/insurance-checker" className="text-primary font-bold hover:underline">Insurance Checker</Link> tool can help you verify coverage.
            </p>
            <p>
              <strong className="text-foreground">Compare across clinics.</strong> Use our directory to{" "}
              <Link to="/search" className="text-primary font-bold hover:underline">compare dentists</Link> across different areas. Prices can vary by 40-60% even within the same emirate, so comparing 3-4 clinics is always worthwhile.
            </p>
          </div>
        </div>
      </Section>

      {/* Internal Links: Find service by Emirate */}
      <Section size="lg" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 text-center">
            Find {treatmentName} <span className="text-primary">By Emirate</span>
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            Browse verified {treatmentName.toLowerCase()} specialists across all 7 UAE emirates
          </p>
          <div className="text-center leading-loose">
            {sortedByPrice.map((range, i) => (
              <span key={range.id}>
                {i > 0 && <span className="text-muted-foreground mx-2">·</span>}
                <Link
                  to={`/${range.state?.slug}`}
                  className="text-primary font-bold hover:underline"
                >
                  {treatmentName} in {range.state?.name}
                </Link>
                <span className="text-xs text-muted-foreground ml-1">
                  (from AED {range.price_min.toLocaleString()})
                </span>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Related Services */}
      {relatedTreatments && relatedTreatments.length > 0 && (
        <Section size="lg">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-foreground mb-4 text-center">
              Compare Costs for <span className="text-primary">Other Services</span>
            </h2>
            <div className="text-center leading-loose">
              {relatedTreatments.map((t, i) => (
                <span key={t.id}>
                  {i > 0 && <span className="text-muted-foreground mx-2">·</span>}
                  <Link to={`/cost/${t.slug}`} className="text-primary font-bold hover:underline">
                    {t.name} Cost
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* FAQ */}
      <Section size="lg" className="bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-2xl px-5 data-[state=open]:border-primary/30">
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

export default ServicePricePage;
