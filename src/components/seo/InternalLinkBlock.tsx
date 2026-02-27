/**
 * InternalLinkBlock - Contextual internal links for SEO
 * 
 * CRITICAL FOR SEO: This component renders semantic internal links
 * that help Google understand topical hierarchy and page relationships.
 * 
 * Guidelines:
 * - 8-15 contextual links per page
 * - Links must be in <main> content area (not just navigation)
 * - Use descriptive anchor text
 */

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface InternalLink {
  label: string;
  href: string;
  description?: string;
}

interface InternalLinkBlockProps {
  title?: string;
  links: InternalLink[];
  variant?: 'grid' | 'list' | 'inline';
  className?: string;
  showDescriptions?: boolean;
}

export const InternalLinkBlock = ({
  title,
  links,
  variant = 'grid',
  className,
  showDescriptions = false,
}: InternalLinkBlockProps) => {
  if (!links.length) return null;

  const containerClasses = cn(
    "internal-links",
    variant === 'grid' && "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
    variant === 'list' && "space-y-2",
    variant === 'inline' && "flex flex-wrap gap-2",
    className
  );

  return (
    <nav 
      className="internal-link-block" 
      aria-label={title || "Related pages"}
    >
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {title}
        </h3>
      )}
      
      <ul className={containerClasses}>
        {links.map((link, index) => (
          <li key={`${link.href}-${index}`}>
            {variant === 'grid' ? (
              <Link
                to={link.href}
                className="block p-3 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-colors group"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-primary">
                  {link.label}
                </span>
                {showDescriptions && link.description && (
                  <span className="block text-xs text-muted-foreground mt-1 line-clamp-2">
                    {link.description}
                  </span>
                )}
              </Link>
            ) : variant === 'list' ? (
              <Link
                to={link.href}
                className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="text-primary">→</span>
                <span>
                  <span className="font-medium text-foreground">{link.label}</span>
                  {showDescriptions && link.description && (
                    <span className="block text-xs mt-0.5">{link.description}</span>
                  )}
                </span>
              </Link>
            ) : (
              <Link
                to={link.href}
                className="inline-flex items-center px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Helper function to generate city page internal links
export const generateCityInternalLinks = (
  stateSlug: string,
  citySlug: string,
  cityName: string,
  stateName: string,
  treatments: { name: string; slug: string }[],
  nearbyCities: { name: string; slug: string }[],
): InternalLink[] => {
  const links: InternalLink[] = [];
  
  // Service links (top 4)
  treatments.slice(0, 4).forEach((t) => {
    links.push({
      label: `${t.name} in ${cityName}`,
      href: `/${stateSlug}/${citySlug}/${t.slug}/`,
      description: `Find ${t.name.toLowerCase()} specialists in ${cityName}, ${stateName}`,
    });
  });
  
  // Nearby city links (top 4)
  nearbyCities.slice(0, 4).forEach((c) => {
    links.push({
      label: `Dentists in ${c.name}`,
      href: `/${stateSlug}/${c.slug}/`,
      description: `Browse dental clinics in ${c.name}, ${stateName}`,
    });
  });
  
  // State link
  links.push({
    label: `All ${stateName} Dentists`,
    href: `/${stateSlug}/`,
    description: `View all dental clinics across ${stateName}`,
  });
  
  // Service directory links
  links.push({
    label: 'Dental Services',
    href: '/services/',
    description: 'Browse all dental treatment categories',
  });

  // Insurance link
  links.push({
    label: 'Dental Insurance Accepted',
    href: '/insurance/',
    description: 'Find dentists by insurance provider',
  });
  
  return links;
};

// Helper function to generate service-location page internal links
export const generateServiceLocationInternalLinks = (
  stateSlug: string,
  citySlug: string,
  cityName: string,
  stateName: string,
  serviceName: string,
  serviceSlug: string,
  relatedServices: { name: string; slug: string }[],
  nearbyCities: { name: string; slug: string }[],
): InternalLink[] => {
  const links: InternalLink[] = [];
  
  // City page link
  links.push({
    label: `All Dentists in ${cityName}`,
    href: `/${stateSlug}/${citySlug}/`,
    description: `View all dental clinics in ${cityName}`,
  });
  
  // Related services in same city (top 4)
  relatedServices.slice(0, 4).forEach((s) => {
    if (s.slug !== serviceSlug) {
      links.push({
        label: `${s.name} in ${cityName}`,
        href: `/${stateSlug}/${citySlug}/${s.slug}/`,
        description: `Find ${s.name.toLowerCase()} specialists locally`,
      });
    }
  });
  
  // Same service in nearby cities (top 3)
  nearbyCities.slice(0, 3).forEach((c) => {
    links.push({
      label: `${serviceName} in ${c.name}`,
      href: `/${stateSlug}/${c.slug}/${serviceSlug}/`,
      description: `${serviceName} providers in ${c.name}`,
    });
  });
  
  // Service overview page
  links.push({
    label: `${serviceName} Overview`,
    href: `/services/${serviceSlug}/`,
    description: `Learn about ${serviceName.toLowerCase()} procedures`,
  });
  
  // State page
  links.push({
    label: `${stateName} Dentists`,
    href: `/${stateSlug}/`,
    description: `Browse all dentists in ${stateName}`,
  });

  // Insurance link
  links.push({
    label: 'Insurance Accepted',
    href: '/insurance/',
    description: 'Find dentists by insurance provider',
  });
  
  return links;
};

// Helper function to generate clinic page internal links
export const generateClinicInternalLinks = (
  clinic: { 
    slug: string; 
    city?: { slug: string; name: string; state?: { abbreviation: string; name?: string } } | null;
  },
  services: { name: string; slug: string }[],
  nearbyClinics: { name: string; slug: string }[],
): InternalLink[] => {
  const links: InternalLink[] = [];
  const citySlug = clinic.city?.slug;
  const cityName = clinic.city?.name;
  const stateSlug = clinic.city?.state?.abbreviation?.toLowerCase();
  const stateName = clinic.city?.state?.name;
  
  if (citySlug && stateSlug && cityName) {
    // City page link
    links.push({
      label: `Dentists in ${cityName}`,
      href: `/${stateSlug}/${citySlug}/`,
      description: `View all dental clinics in ${cityName}`,
    });
    
    // Services in city (top 4)
    services.slice(0, 4).forEach((s) => {
      links.push({
        label: `${s.name} in ${cityName}`,
        href: `/${stateSlug}/${citySlug}/${s.slug}/`,
        description: `Find ${s.name.toLowerCase()} specialists`,
      });
    });
  }
  
  // Nearby clinics (top 4)
  nearbyClinics.slice(0, 4).forEach((c) => {
    links.push({
      label: c.name,
      href: `/clinic/${c.slug}/`,
      description: 'View clinic profile',
    });
  });
  
  // Service directory
  links.push({
    label: 'All Dental Services',
    href: '/services/',
    description: 'Browse dental treatment categories',
  });

  // Insurance directory
  links.push({
    label: 'Insurance Accepted',
    href: '/insurance/',
    description: 'Find dentists by insurance provider',
  });
  
  return links;
};

export default InternalLinkBlock;
