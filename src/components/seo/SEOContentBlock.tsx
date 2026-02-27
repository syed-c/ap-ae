import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  MapPin,
  Star,
  Shield,
  Award,
  Clock,
  CreditCard,
  Stethoscope,
  Building2,
  HeartPulse,
  CheckCircle2
} from "lucide-react";
import { withTrailingSlash } from "@/lib/url/withTrailingSlash";
import { parseMarkdownToHtml, stripMarkdown } from "@/lib/utils/parseMarkdown";

interface ParsedSection {
  heading: string;
  content: string;
  level: number;
}

interface SEOContentBlockProps {
  variant: "state" | "city" | "service-location" | "service";
  locationName: string;
  stateName?: string;
  stateAbbr?: string;
  stateSlug?: string;
  citySlug?: string;
  treatmentName?: string;
  treatmentSlug?: string;
  clinicCount?: number;
  cityCount?: number;
  parsedContent?: {
    intro: string;
    sections: ParsedSection[];
  } | null;
  popularTreatments?: { name: string; slug: string }[];
  nearbyLocations?: { name: string; slug: string }[];
  isLoading?: boolean;
}

/**
 * SEOContentBlock - A unified, SEO-optimized content section
 * Renders unique, location-specific content as real HTML for Google indexing.
 * Uses a clean, professional layout with proper semantic structure.
 */
export const SEOContentBlock = ({
  variant,
  locationName,
  stateName = "",
  stateAbbr = "",
  stateSlug = "",
  citySlug = "",
  treatmentName = "",
  treatmentSlug = "",
  clinicCount = 0,
  cityCount = 0,
  parsedContent,
  popularTreatments = [],
  nearbyLocations = [],
  isLoading = false,
}: SEOContentBlockProps) => {
  // If still loading, show semantic HTML skeleton for bots
  // IMPORTANT: We render real HTML structure so bots can crawl even during loading
  if (isLoading) {
    return (
      <article 
        className="space-y-6"
        aria-busy="true"
        itemScope 
        itemType="https://schema.org/Article"
      >
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm animate-pulse">
          <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-4">
            {/* SEO: Keep semantic headings visible for crawlers */}
            <h2 className="sr-only" itemProp="headline">
              {variant === 'service-location' ? `${treatmentName} in ${locationName}` : 
               variant === 'city' ? `Dental Care in ${locationName}` :
               variant === 'service' ? `About ${treatmentName}` :
               `Dentists in ${locationName}`}
            </h2>
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
            <div className="h-4 w-4/5 bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </div>
      </article>
    );
  }

  const hasOptimizedContent =
    !!parsedContent &&
    (parsedContent.intro.trim().length > 0 || (parsedContent.sections?.length ?? 0) > 0);

  if (hasOptimizedContent) {
    return (
      <OptimizedContentLayout 
        parsedContent={parsedContent} 
        variant={variant}
        locationName={locationName}
        stateName={stateName}
        treatmentName={treatmentName}
        stateSlug={stateSlug}
        citySlug={citySlug}
        treatmentSlug={treatmentSlug}
        popularTreatments={popularTreatments}
        nearbyLocations={nearbyLocations}
      />
    );
  }

  // Even without optimized content, render minimal semantic structure for SEO
  return (
    <article 
      className="space-y-6"
      itemScope 
      itemType="https://schema.org/Article"
    >
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-3" itemProp="headline">
            {variant === 'service-location' ? `About ${treatmentName} in ${locationName}` : 
             variant === 'city' ? `Dental Care in ${locationName}` :
             variant === 'service' ? `About ${treatmentName}` :
             `Dental Services in ${locationName}`}
          </h2>
          <p className="text-muted-foreground leading-relaxed" itemProp="articleBody">
            {variant === 'service-location' 
              ? `Find qualified ${treatmentName?.toLowerCase()} specialists in ${locationName}. Our directory includes verified dental professionals with expertise in ${treatmentName?.toLowerCase()} procedures.`
              : variant === 'city'
              ? `Discover top-rated dental professionals in ${locationName}. Browse verified clinics, compare services, and book appointments online.`
              : variant === 'service'
              ? `Learn about ${treatmentName} and find qualified specialists across the UAE. Compare providers and book consultations.`
              : `Find trusted dental care providers in ${locationName}. Our directory features verified clinics with patient reviews and online booking.`
            }
          </p>
        </div>
      </div>
    </article>
  );
};

// Optimized content from database - clean, professional layout
const OptimizedContentLayout = ({
  parsedContent,
  variant,
  locationName,
  stateName,
  treatmentName,
  stateSlug,
  citySlug,
  treatmentSlug,
  popularTreatments,
  nearbyLocations,
}: {
  parsedContent: { intro: string; sections: ParsedSection[] };
  variant: string;
  locationName: string;
  stateName?: string;
  treatmentName?: string;
  stateSlug?: string;
  citySlug?: string;
  treatmentSlug?: string;
  popularTreatments?: { name: string; slug: string }[];
  nearbyLocations?: { name: string; slug: string }[];
}) => {
  const getVariantIcon = () => {
    switch (variant) {
      case "state":
        return <Building2 className="h-5 w-5 text-primary" />;
      case "city":
        return <MapPin className="h-5 w-5 text-primary" />;
      case "service-location":
        return <Stethoscope className="h-5 w-5 text-primary" />;
      case "service":
        return <HeartPulse className="h-5 w-5 text-primary" />;
      default:
        return <Sparkles className="h-5 w-5 text-primary" />;
    }
  };

  const getVariantLabel = () => {
    switch (variant) {
      case "state":
        return `${locationName} Dental Guide`;
      case "city":
        return `${locationName} Dental Care`;
      case "service-location":
        return `${treatmentName} in ${locationName}`;
      case "service":
        return `About ${treatmentName}`;
      default:
        return "Expert Information";
    }
  };

  // Filter FAQ sections - they render separately
  // Also SKIP the first section as it's already rendered in PageIntroSection
  const contentSections = parsedContent.sections
    .slice(1) // Skip first section (shown in PageIntroSection)
    .filter(
      s => !s.heading.toLowerCase().includes('frequently asked') && 
           !s.heading.toLowerCase().includes('faq')
    );

  return (
    <article 
      className="space-y-6"
      itemScope 
      itemType="https://schema.org/Article"
    >
      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {getVariantIcon()}
            </div>
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                {getVariantLabel()}
              </span>
              <p className="text-sm text-muted-foreground">Verified dental guidance</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8">
          {/* 
           * NOTE: Intro is intentionally NOT rendered here.
           * It's already displayed in PageIntroSection (above the dentist list)
           * to avoid duplicate content on the page.
           */}

          {/* Main Sections - Rendered as semantic HTML for SEO */}
          <div className="space-y-6">
            {contentSections.slice(0, 4).map((section, idx) => (
              <section key={idx} className="border-l-2 border-primary/20 pl-4 md:pl-6">
                {section.level === 2 ? (
                  <h2 
                    className="text-xl font-bold text-foreground mb-3"
                    itemProp="headline"
                  >
                    {stripMarkdown(section.heading)}
                  </h2>
                ) : (
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {stripMarkdown(section.heading)}
                  </h3>
                )}
                <div 
                  className="text-muted-foreground leading-relaxed prose prose-sm max-w-none [&_table]:my-4 [&_th]:text-left [&_td]:align-top"
                  dangerouslySetInnerHTML={{ 
                    __html: parseMarkdownToHtml(section.content)
                  }}
                />
              </section>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Internal Links Section */}
      {(popularTreatments && popularTreatments.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Popular Treatments
          </h3>
          <nav className="flex flex-wrap gap-2" aria-label="Related treatments">
            {popularTreatments.slice(0, 8).map((t) => (
              <Link
                key={t.slug}
                to={withTrailingSlash(citySlug ? `/${stateSlug}/${citySlug}/${t.slug}` : `/services/${t.slug}`)}
                className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}

      {/* Nearby Locations */}
      {(nearbyLocations && nearbyLocations.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Nearby Cities
          </h3>
          <nav className="flex flex-wrap gap-2" aria-label="Nearby locations">
            {nearbyLocations.map((loc) => (
              <Link
                key={loc.slug}
                to={withTrailingSlash(`/${stateSlug}/${loc.slug}`)}
                className="flex items-center gap-1 bg-muted hover:bg-muted/80 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                <MapPin className="h-3 w-3" />
                {loc.name}
              </Link>
            ))}
          </nav>
        </motion.div>
      )}
    </article>
  );
};

export default SEOContentBlock;
