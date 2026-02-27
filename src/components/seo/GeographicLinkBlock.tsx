/**
 * GeographicLinkBlock - Contextual body links for SEO authority distribution
 * 
 * Creates internal link graphs based on page type:
 * - STATE PAGE: links to top cities, major services, neighboring states
 * - CITY PAGE: links to services in city, nearby cities, parent state
 * - SERVICE-CITY PAGE: links to same service in nearby cities, related services, parent city
 * 
 * This component implements the "ranking reinforcement loops" SEO pattern.
 * CANONICAL: All URLs use trailing slash format.
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Stethoscope,
  ArrowRight,
  Building2,
  Navigation
} from "lucide-react";

// Neighboring emirate/state relationships (UAE + existing US states)
const NEIGHBORING_STATES: Record<string, { name: string; slug: string }[]> = {
  dubai: [
    { name: "Sharjah", slug: "sharjah" },
    { name: "Abu Dhabi", slug: "abu-dhabi" },
    { name: "Ajman", slug: "ajman" },
  ],
  "abu-dhabi": [
    { name: "Dubai", slug: "dubai" },
    { name: "Sharjah", slug: "sharjah" },
  ],
  sharjah: [
    { name: "Dubai", slug: "dubai" },
    { name: "Ajman", slug: "ajman" },
  ],
  ajman: [
    { name: "Sharjah", slug: "sharjah" },
    { name: "Dubai", slug: "dubai" },
  ],
  "ras-al-khaimah": [
    { name: "Sharjah", slug: "sharjah" },
    { name: "Umm Al Quwain", slug: "umm-al-quwain" },
  ],
  "umm-al-quwain": [
    { name: "Ajman", slug: "ajman" },
    { name: "Ras Al Khaimah", slug: "ras-al-khaimah" },
  ],
  fujairah: [
    { name: "Sharjah", slug: "sharjah" },
    { name: "Ras Al Khaimah", slug: "ras-al-khaimah" },
  ],
  ca: [],
  nj: [
    { name: "Connecticut", slug: "ct" },
    { name: "Massachusetts", slug: "ma" },
  ],
  ma: [
    { name: "Connecticut", slug: "ct" },
    { name: "New Jersey", slug: "nj" },
  ],
  ct: [
    { name: "New Jersey", slug: "nj" },
    { name: "Massachusetts", slug: "ma" },
  ],
};

// Related services mapping for cross-linking (expanded for UAE dental market)
const RELATED_SERVICES: Record<string, string[]> = {
  "dental-implants": ["dental-crowns", "dental-veneers", "teeth-whitening", "bone-grafting"],
  "teeth-whitening": ["dental-veneers", "teeth-cleaning", "invisalign", "smile-makeover"],
  "root-canal-treatment": ["dental-crowns", "teeth-cleaning", "dental-implants", "tooth-extraction"],
  "dental-crowns": ["dental-veneers", "root-canal-treatment", "dental-implants", "dental-bridges"],
  "invisalign": ["braces", "teeth-whitening", "dental-veneers", "retainers"],
  "dental-veneers": ["teeth-whitening", "dental-crowns", "invisalign", "smile-makeover"],
  "teeth-cleaning": ["teeth-whitening", "root-canal-treatment", "dental-crowns", "gum-treatment"],
  "braces": ["invisalign", "teeth-cleaning", "teeth-whitening", "retainers"],
  "gum-treatment": ["teeth-cleaning", "root-canal-treatment", "dental-implants"],
  "tooth-extraction": ["dental-implants", "root-canal-treatment", "wisdom-teeth-removal"],
  "dental-bridges": ["dental-crowns", "dental-implants", "dental-veneers"],
  "smile-makeover": ["dental-veneers", "teeth-whitening", "invisalign"],
  "pediatric-dentistry": ["teeth-cleaning", "braces", "dental-sealants"],
  "wisdom-teeth-removal": ["tooth-extraction", "dental-implants", "root-canal-treatment"],
};

interface GeographicLinkBlockProps {
  pageType: "state" | "city" | "service-location";
  stateSlug: string;
  stateName: string;
  citySlug?: string;
  cityName?: string;
  serviceSlug?: string;
  serviceName?: string;
  // Data passed from parent to avoid duplicate queries
  topCities?: { name: string; slug: string }[];
  nearbyCities?: { name: string; slug: string }[];
  services?: { name: string; slug: string }[];
}

export const GeographicLinkBlock = ({
  pageType,
  stateSlug,
  stateName,
  citySlug,
  cityName,
  serviceSlug,
  serviceName,
  topCities = [],
  nearbyCities = [],
  services = [],
}: GeographicLinkBlockProps) => {
  const neighboringStates = NEIGHBORING_STATES[stateSlug] || [];
  const relatedServiceSlugs = serviceSlug ? RELATED_SERVICES[serviceSlug] || [] : [];
  const relatedServices = services.filter(s => relatedServiceSlugs.includes(s.slug)).slice(0, 4);

  // STATE PAGE: Links to cities, services, neighboring states
  if (pageType === "state") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
        aria-label="Explore more locations"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Explore Dental Care in {stateName}
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Top Cities */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Top Cities
            </h4>
            <nav className="space-y-1.5">
              {topCities.slice(0, 6).map((city) => (
                <Link
                  key={city.slug}
                  to={`/${stateSlug}/${city.slug}/`}
                  className="block text-sm text-foreground hover:text-primary transition-colors"
                >
                  Dentists in {city.name} →
                </Link>
              ))}
            </nav>
          </div>

          {/* Major Services */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Stethoscope className="h-4 w-4" /> Popular Services
            </h4>
            <nav className="space-y-1.5">
              {services.slice(0, 6).map((service) => (
                <Link
                  key={service.slug}
                  to={`/services/${service.slug}/`}
                  className="block text-sm text-foreground hover:text-primary transition-colors"
                >
                  {service.name} →
                </Link>
              ))}
            </nav>
          </div>

          {/* Neighboring States */}
          {neighboringStates.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Nearby States
              </h4>
              <nav className="space-y-1.5">
                {neighboringStates.map((state) => (
                  <Link
                    key={state.slug}
                    to={`/${state.slug}/`}
                    className="block text-sm text-foreground hover:text-primary transition-colors"
                  >
                    Dentists in {state.name} →
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </motion.section>
    );
  }

  // CITY PAGE: Links to services in city, nearby cities, parent state
  if (pageType === "city" && citySlug && cityName) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
        aria-label="Explore dental services"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Dental Services in {cityName}
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Services in City */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Stethoscope className="h-4 w-4" /> Services in {cityName}
            </h4>
            <nav className="space-y-1.5">
              {services.slice(0, 6).map((service) => (
                <Link
                  key={service.slug}
                  to={`/${stateSlug}/${citySlug}/${service.slug}/`}
                  className="block text-sm text-foreground hover:text-primary transition-colors"
                >
                  {service.name} →
                </Link>
              ))}
            </nav>
          </div>

          {/* Nearby Cities */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Nearby Cities
            </h4>
            <nav className="space-y-1.5">
              {nearbyCities.slice(0, 6).map((city) => (
                <Link
                  key={city.slug}
                  to={`/${stateSlug}/${city.slug}/`}
                  className="block text-sm text-foreground hover:text-primary transition-colors"
                >
                  Dentists in {city.name} →
                </Link>
              ))}
            </nav>
          </div>

          {/* Parent State */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Building2 className="h-4 w-4" /> Browse State
            </h4>
            <nav className="space-y-1.5">
              <Link
                to={`/${stateSlug}/`}
                className="block text-sm text-foreground hover:text-primary transition-colors"
              >
                All cities in {stateName} →
              </Link>
              {neighboringStates.slice(0, 2).map((state) => (
                <Link
                  key={state.slug}
                  to={`/${state.slug}/`}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Dentists in {state.name} →
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </motion.section>
    );
  }

  // SERVICE-LOCATION PAGE: Links to same service nearby, related services, parent city
  if (pageType === "service-location" && citySlug && cityName && serviceSlug && serviceName) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
        aria-label="Related dental services"
      >
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          More {serviceName} Options
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Same Service in Nearby Cities */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {serviceName} Nearby
            </h4>
            <nav className="space-y-1.5">
              {nearbyCities.slice(0, 5).map((city) => (
                <Link
                  key={city.slug}
                  to={`/${stateSlug}/${city.slug}/${serviceSlug}/`}
                  className="block text-sm text-foreground hover:text-primary transition-colors"
                >
                  {serviceName} in {city.name} →
                </Link>
              ))}
            </nav>
          </div>

          {/* Related Services in Same City */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Stethoscope className="h-4 w-4" /> Related in {cityName}
            </h4>
            <nav className="space-y-1.5">
              {relatedServices.map((service) => (
                <Link
                  key={service.slug}
                  to={`/${stateSlug}/${citySlug}/${service.slug}/`}
                  className="block text-sm text-foreground hover:text-primary transition-colors"
                >
                  {service.name} →
                </Link>
              ))}
              <Link
                to={`/${stateSlug}/${citySlug}/`}
                className="block text-sm text-primary hover:underline font-medium mt-2"
              >
                All services in {cityName} →
              </Link>
            </nav>
          </div>

          {/* Parent Hierarchy */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Building2 className="h-4 w-4" /> Browse More
            </h4>
            <nav className="space-y-1.5">
              <Link
                to={`/${stateSlug}/${citySlug}/`}
                className="block text-sm text-foreground hover:text-primary transition-colors"
              >
                All dentists in {cityName} →
              </Link>
              <Link
                to={`/${stateSlug}/`}
                className="block text-sm text-foreground hover:text-primary transition-colors"
              >
                All cities in {stateName} →
              </Link>
              <Link
                to={`/services/${serviceSlug}/`}
                className="block text-sm text-foreground hover:text-primary transition-colors"
              >
                {serviceName} nationwide →
              </Link>
            </nav>
          </div>
        </div>
      </motion.section>
    );
  }

  return null;
};

export default GeographicLinkBlock;
