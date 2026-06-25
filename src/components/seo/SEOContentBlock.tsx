import Link from "next/link";
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
import { buildUrl } from "@/lib/url/buildProfileUrl";
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
        <div className="marketplace-panel overflow-hidden animate-pulse">
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

  // No optimized content from database - show fallback content for SEO value
  // This ensures city pages have substantive content even when clinic data is sparse
  if (variant === "city" && clinicCount === 0) {
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
           className="marketplace-panel overflow-hidden"
         >
           {/* Header */}
           <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <MapPin className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <span className="text-xs font-bold text-primary uppercase tracking-widest">
                   Dental Care in {locationName}
                 </span>
                 <p className="text-sm text-muted-foreground">Essential oral health information for {stateName}</p>
               </div>
             </div>
           </div>

           {/* Content Body */}
           <div className="p-6 md:p-8">
             {/* Main Sections - Rendered as semantic HTML for SEO */}
             <div className="space-y-8">
               {/* Section 1: General Dental Care Information */}
               <section className="border-l-2 border-primary/20 pl-4 md:pl-6">
                 <h2 className="text-xl font-bold text-foreground mb-3" itemProp="headline">
                   Essential Dental Care Guidance for {locationName}
                 </h2>
                 <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none">
                   <p>Maintaining good oral health is essential for overall wellbeing, especially in the {stateName} region where climate and lifestyle factors can impact dental health.</p>
                   <p>The dental care landscape in {locationName} continues to evolve, with increasing focus on preventive care, cosmetic dentistry, and advanced treatment options. Regular dental check-ups are recommended every 6 months to maintain optimal oral health.</p>
                   <p>Even without specific clinic listings in our database, residents of {locationName} have access to quality dental care through various channels including government hospitals, private clinics, and specialized dental centers.</p>
                 </div>
               </section>
               
               {/* Section 2: Oral Health Tips for UAE Climate */}
               <section className="border-l-2 border-primary/20 pl-4 md:pl-6">
                 <h2 className="text-xl font-bold text-foreground mb-3" itemProp="headline">
                   Oral Health Tips for {stateName} Residents
                 </h2>
                 <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none">
                   <ul className="space-y-2">
                     <li><strong>Stay Hydrated:</strong> The {stateName} climate can lead to dry mouth, increasing cavity risk. Drink plenty of water throughout the day.</li>
                     <li><strong>Sun Protection:</strong> Use lip balm with SPF to protect lips from UV damage, which can increase oral cancer risk.</li>
                     <li><strong>Diet Awareness:</strong> Limit sugary beverages and foods, especially during hot weather when consumption tends to increase.</li>
                     <li><strong>Regular Check-ups:</strong> Visit a dentist every 6 months for preventive care and early detection of issues.</li>
                     <li><strong>Proper Brushing:</strong> Brush twice daily with fluoride toothpaste for at least 2 minutes each time.</li>
                     <li><strong>Floss Daily:</strong> Clean between teeth daily to remove plaque and food particles that brushing misses.</li>
                   </ul>
                 </div>
               </section>
               
               {/* Section 3: Finding Dental Care in {locationName} */}
               <section className="border-l-2 border-primary/20 pl-4 md:pl-6">
                 <h2 className="text-xl font-bold text-foreground mb-3" itemProp="headline">
                   How to Find Quality Dental Care in {locationName}
                 </h2>
                 <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none">
                   <p>When searching for a dental provider in {locationName}, consider these factors:</p>
                   <ul className="space-y-2">
                     <li><strong>Credentials:</strong> Ensure the dentist is licensed by UAE health authorities (DHA, MOHAP, or relevant emirate health authority)</li>
                     <li><strong>Services Offered:</strong> Look for clinics that provide the specific treatments you need, from general dentistry to specialized care</li>
                     <li><strong>Patient Reviews:</strong> Check verified patient feedback to gauge quality of care and patient satisfaction</li>
                     <li><strong>Technology & Hygiene:</strong> Modern clinics use advanced sterilization techniques and up-to-date equipment</li>
                     <li><strong>Accessibility:</strong> Consider location, parking, and appointment availability that fits your schedule</li>
                   </ul>
                   <p>AppointPanda is continuously expanding our database of verified dental clinics across the UAE. While we may not have specific listings for {locationName} yet, we encourage you to:</p>
                   <ul className="space-y-2">
                     <li>Check nearby emirates for available dental care options</li>
                     <li>Consult with your insurance provider for in-network dental clinics</li>
                     <li>Ask for recommendations from friends, family, or healthcare providers</li>
                     <li>Visit government health authority websites for lists of licensed dental practitioners</li>
                   </ul>
                 </div>
               </section>
               
               {/* Section 4: Nearby Cities with Dental Care */}
               {nearbyLocations && nearbyLocations.length > 0 && (
                 <section className="border-l-2 border-primary/20 pl-4 md:pl-6">
                   <h2 className="text-xl font-bold text-foreground mb-3" itemProp="headline">
                     Nearby Areas with Available Dental Care
                   </h2>
                   <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none">
                     <p>While specific clinic listings for {locationName} may be limited in our database, residents can access quality dental care in nearby cities within {stateName}:</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">
                       {nearbyLocations.slice(0, 8).map((loc, index) => (
                         <Link
                           key={loc.slug}
                           href={stateSlug && citySlug ? buildUrl(stateSlug, loc.slug) : loc.slug.startsWith('/') ? loc.slug : `/${loc.slug}/`}
                           className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                         >
                           <MapPin className="h-4 w-4 text-primary shrink-0" />
                           <div>
                             <div className="font-medium text-foreground">{loc.name}</div>
                           </div>
                         </Link>
                       ))}
                     </div>
                     <p><em>Note: For the most current information on dental care availability, we recommend contacting local health authorities or using our search feature to check nearby locations.</em></p>
                   </div>
                 </section>
               )}
             </div>
           </div>
         </motion.div>
       </article>
     );
   }
    
  return null;
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

  // If no sections left after filtering but there IS intro content, still show it
  // This ensures content appears even if it has no headings
  const showFullContent = contentSections.length === 0 && parsedContent.intro.trim().length > 0;
  
  // If there's content but no sections, use the intro as a section
  const displaySections = showFullContent 
    ? [{ heading: '', content: parsedContent.intro, level: 2 } as ParsedSection]
    : contentSections;
  
  // Also show if there are sections
  const shouldShow = displaySections.length > 0;
  
  if (!shouldShow) {
    return null;
  }

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
            {displaySections.slice(0, 4).map((section, idx) => (
              <section key={idx} className="rounded-[1.25rem] border border-border/60 bg-muted/25 p-5 md:p-6">
                {section.heading ? (
                  section.level === 2 ? (
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
                  )
                ) : null}
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
           className="marketplace-panel p-6"
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Popular Treatments
          </h3>
          <nav className="flex flex-wrap gap-2" aria-label="Related treatments">
            {popularTreatments.slice(0, 8).map((t) => (
              <Link
                key={t.slug}
                href={stateSlug && citySlug ? buildUrl(stateSlug, citySlug, t.slug) : buildUrl('services', t.slug)}
                className="rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
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
          className="marketplace-panel p-6"
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Nearby Cities
          </h3>
          <nav className="flex flex-wrap gap-2" aria-label="Nearby locations">
            {nearbyLocations.map((loc) => (
              <Link
                key={loc.slug}
                href={withTrailingSlash(`/${stateSlug}/${loc.slug}`)}
                className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/70"
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
