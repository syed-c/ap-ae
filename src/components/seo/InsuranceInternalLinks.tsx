/**
 * Insurance-aware internal linking component.
 * Generates contextual cross-links between insurance, location, and service pages.
 */

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildInsuranceUrl, buildServiceUrl, buildCityUrl } from "@/lib/url/buildProfileUrl";
import { withTrailingSlash } from "@/lib/url/withTrailingSlash";

interface InsuranceInternalLinksProps {
  /** Current context to exclude from links */
  currentInsuranceSlug?: string;
  currentServiceSlug?: string;
  currentStateSlug?: string;
  currentCitySlug?: string;
  /** Which link types to show */
  showInsurances?: boolean;
  showServices?: boolean;
  showLocations?: boolean;
  /** Max items per section */
  maxItems?: number;
  className?: string;
}

export function InsuranceInternalLinks({
  currentInsuranceSlug,
  currentServiceSlug,
  currentStateSlug,
  currentCitySlug,
  showInsurances = true,
  showServices = true,
  showLocations = true,
  maxItems = 4,
  className,
}: InsuranceInternalLinksProps) {
  const { data: insurances } = useQuery({
    queryKey: ["internal-links-insurances"],
    queryFn: async () => {
      const { data } = await supabase
        .from("insurances")
        .select("name, slug")
        .eq("is_active", true)
        .order("display_order")
        .limit(12);
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    enabled: showInsurances,
  });

  const { data: services } = useQuery({
    queryKey: ["internal-links-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("treatments")
        .select("name, slug")
        .eq("is_active", true)
        .order("display_order")
        .limit(12);
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    enabled: showServices,
  });

  const { data: emirates } = useQuery({
    queryKey: ["internal-links-emirates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("states")
        .select("name, slug")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    enabled: showLocations,
  });

  const filteredInsurances = (insurances || [])
    .filter((i) => i.slug !== currentInsuranceSlug)
    .slice(0, maxItems);

  const filteredServices = (services || [])
    .filter((s) => s.slug !== currentServiceSlug)
    .slice(0, maxItems);

  const filteredEmirates = (emirates || [])
    .filter((e) => e.slug !== currentStateSlug)
    .slice(0, maxItems);

  const hasLinks = filteredInsurances.length > 0 || filteredServices.length > 0 || filteredEmirates.length > 0;
  if (!hasLinks) return null;

  return (
    <div className={className}>
      <div className="grid md:grid-cols-3 gap-6">
        {showInsurances && filteredInsurances.length > 0 && (
          <nav aria-label="Related insurance providers">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
              Insurance Providers
            </h3>
            <ul className="space-y-2">
              {filteredInsurances.map((ins) => (
                <li key={ins.slug}>
                  <Link
                    to={buildInsuranceUrl(ins.slug)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {ins.name} Dentists
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/insurance/"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View All Insurance →
                </Link>
              </li>
            </ul>
          </nav>
        )}

        {showServices && filteredServices.length > 0 && (
          <nav aria-label="Dental services">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
              Popular Services
            </h3>
            <ul className="space-y-2">
              {filteredServices.map((svc) => (
                <li key={svc.slug}>
                  <Link
                    to={buildServiceUrl(svc.slug)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {svc.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/services/"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  All Services →
                </Link>
              </li>
            </ul>
          </nav>
        )}

        {showLocations && filteredEmirates.length > 0 && (
          <nav aria-label="Browse by location">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
              Browse by Emirate
            </h3>
            <ul className="space-y-2">
              {filteredEmirates.map((em) => (
                <li key={em.slug}>
                  <Link
                    to={withTrailingSlash(`/${em.slug}`)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Dentists in {em.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
