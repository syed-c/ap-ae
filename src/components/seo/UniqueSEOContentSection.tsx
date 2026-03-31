import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  MapPin,
  Star,
  Shield,
  Award,
  HeartPulse,
  Building2,
  Clock,
  CreditCard,
  Stethoscope,
} from "lucide-react";
import { parseMarkdownToHtml, stripMarkdown } from "@/lib/utils/parseMarkdown";

interface UniqueSEOContentSectionProps {
  variant: "state" | "city" | "service-location" | "service";
  // Primary identifiers - used for unique content generation
  locationName: string;
  stateName?: string;
  stateAbbr?: string;
  stateSlug?: string;
  citySlug?: string;
  treatmentName?: string;
  treatmentSlug?: string;
  // Dynamic data
  clinicCount?: number;
  cityCount?: number;
  // Parsed SEO content from seo_pages table (if available)
  parsedContent?: {
    intro: string;
    sections: { heading: string; content: string; level: number }[];
  } | null;
  // Links for interlinking
  popularTreatments?: { name: string; slug: string }[];
  nearbyLocations?: { name: string; slug: string }[];
  // Loading state - when true, show nothing (prevents flash of fallback content)
  isLoading?: boolean;
}

/**
 * UNIFIED SEO Content Section
 * Renders unique, location/service-specific content to avoid duplicate content penalties.
 * Priority: 1) seo_pages optimized content, 2) LocationSEOContent fallback with unique text
 */
export const UniqueSEOContentSection = ({
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
}: UniqueSEOContentSectionProps) => {
  // If still loading SEO content, show nothing to prevent flash of fallback content
  if (isLoading) {
    return null;
  }

  // If we have optimized content from seo_pages, use that (guaranteed unique)
  // NOTE: Some generated markdown starts with a heading (no intro paragraph).
  // We still want to render the optimized content as long as we have ANY content.
  const hasOptimizedContent =
    !!parsedContent &&
    (parsedContent.intro.trim().length > 0 || (parsedContent.sections?.length ?? 0) > 0);

  if (hasOptimizedContent) {
    return (
      <OptimizedContent 
        parsedContent={parsedContent} 
        variant={variant}
        locationName={locationName}
        stateName={stateName}
        treatmentName={treatmentName}
      />
    );
  }

  // No optimized content from seo_pages - show nothing (no fallback)
  // This forces content generation via admin panel before pages go live
  return null;
};

// Render optimized content from seo_pages table with enhanced visual design
const OptimizedContent = ({
  parsedContent,
  variant,
  locationName,
  stateName,
  treatmentName,
}: {
  parsedContent: { intro: string; sections: { heading: string; content: string; level: number }[] };
  variant: string;
  locationName: string;
  stateName?: string;
  treatmentName?: string;
}) => {
  const getDefaultHeading = () => {
    switch (variant) {
      case "state":
        return `About Dental Care in ${locationName}`;
      case "city":
        return `Dental Services in ${locationName}, ${stateName}`;
      case "service-location":
        return `${treatmentName} Services in ${locationName}`;
      case "service":
        return `About ${treatmentName}`;
      default:
        return `About ${locationName}`;
    }
  };

  // Filter out FAQ sections as they're rendered separately
  const contentSections = parsedContent.sections.filter(
    s => !s.heading.toLowerCase().includes('frequently asked') && !s.heading.toLowerCase().includes('faq')
  );

  return (
    <div className="space-y-8">
      {/* Main intro card */}
      <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border rounded-3xl p-8 md:p-12 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Expert Information</span>
            <p className="text-sm text-muted-foreground">Verified dental guidance</p>
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-foreground mb-6">
          {stripMarkdown(contentSections[0]?.heading || getDefaultHeading())}
        </h2>

        {parsedContent.intro && (
          <div
            className="text-muted-foreground leading-relaxed text-lg prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(parsedContent.intro) }}
          />
        )}

        {/* First section content if it exists */}
        {contentSections[0]?.content && (
          <div
            className="text-muted-foreground leading-relaxed prose prose-lg max-w-none mt-6"
            dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(contentSections[0].content) }}
          />
        )}
      </div>
      
      {/* Additional sections with alternating layouts */}
      {contentSections.slice(1, 5).map((section, idx) => (
        <div 
          key={idx} 
          className={`bg-card border border-border rounded-2xl p-6 md:p-8 ${
            idx % 2 === 0 ? 'md:ml-8' : 'md:mr-8'
          }`}
        >
          {section.level === 2 ? (
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <span className="h-8 w-1 bg-primary rounded-full" />
              {stripMarkdown(section.heading)}
            </h2>
          ) : (
            <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-6 w-1 bg-primary/50 rounded-full" />
              {stripMarkdown(section.heading)}
            </h3>
          )}
          <div
            className="text-muted-foreground leading-relaxed prose prose-base max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(section.content) }}
          />
        </div>
      ))}
    </div>
  );
};
