/**
 * useAutoInternalLinks - Unified internal link computation
 * 
 * Ensures every page has: parent link, child links, 2+ lateral links.
 * Uses natural anchor text variations to avoid over-optimization.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LinkItem {
  label: string;
  href: string;
  type: "parent" | "child" | "lateral" | "sibling";
}

// Anchor text variations to avoid repetitive link patterns
const ANCHOR_VARIATIONS: Record<string, string[]> = {
  city: [
    "Dentists in {name}",
    "Find a dentist in {name}",
    "{name} dental clinics",
    "Top-rated dentists in {name}",
    "Book a dentist in {name}",
  ],
  treatment: [
    "{name}",
    "{name} specialists",
    "Best {name} clinics",
    "Get {name} near you",
    "{name} treatment",
  ],
  clinic: [
    "{name}",
    "Visit {name}",
    "{name} dental clinic",
    "Book at {name}",
  ],
};

function pickAnchor(type: keyof typeof ANCHOR_VARIATIONS, name: string, index: number): string {
  const variations = ANCHOR_VARIATIONS[type] || ["{name}"];
  const template = variations[index % variations.length];
  return template.replace("{name}", name);
}

interface UseAutoInternalLinksParams {
  pageType: "clinic" | "city" | "treatment" | "service-location" | "state" | "dentist";
  stateSlug?: string;
  citySlug?: string;
  treatmentSlug?: string;
  clinicId?: string;
  cityName?: string;
  stateName?: string;
  treatmentName?: string;
}

export function useAutoInternalLinks({
  pageType,
  stateSlug,
  citySlug,
  treatmentSlug,
  clinicId,
  cityName,
  stateName,
  treatmentName,
}: UseAutoInternalLinksParams) {
  return useQuery({
    queryKey: ["auto-internal-links", pageType, stateSlug, citySlug, treatmentSlug, clinicId],
    queryFn: async (): Promise<LinkItem[]> => {
      const links: LinkItem[] = [];

      // Always add parent links
      if (pageType === "clinic" && citySlug && stateSlug && cityName) {
        links.push({
          label: pickAnchor("city", cityName, 0),
          href: `/${stateSlug}/${citySlug}/`,
          type: "parent",
        });
      }

      if (pageType === "city" && stateSlug && stateName) {
        links.push({
          label: `All ${stateName} Dentists`,
          href: `/${stateSlug}/`,
          type: "parent",
        });
      }

      if (pageType === "service-location" && citySlug && stateSlug && cityName) {
        links.push({
          label: pickAnchor("city", cityName, 1),
          href: `/${stateSlug}/${citySlug}/`,
          type: "parent",
        });
        if (treatmentSlug && treatmentName) {
          links.push({
            label: `${treatmentName} Overview`,
            href: `/services/${treatmentSlug}/`,
            type: "parent",
          });
        }
      }

      // Fetch lateral links (sibling cities)
      if ((pageType === "city" || pageType === "clinic") && stateSlug && citySlug) {
        const { data: siblingCities } = await supabase
          .from("cities")
          .select("name, slug")
          .eq("is_active", true)
          .neq("slug", citySlug)
          .limit(4);

        siblingCities?.forEach((city, i) => {
          links.push({
            label: pickAnchor("city", city.name, i + 1),
            href: `/${stateSlug}/${city.slug}/`,
            type: "lateral",
          });
        });
      }

      // Fetch child links (treatments for city pages)
      if ((pageType === "city" || pageType === "state") && stateSlug) {
        const { data: treatments } = await supabase
          .from("treatments")
          .select("name, slug")
          .eq("is_active", true)
          .order("display_order")
          .limit(6);

        treatments?.forEach((t, i) => {
          if (citySlug) {
            links.push({
              label: pickAnchor("treatment", t.name, i),
              href: `/${stateSlug}/${citySlug}/${t.slug}/`,
              type: "child",
            });
          } else {
            links.push({
              label: pickAnchor("treatment", t.name, i),
              href: `/services/${t.slug}/`,
              type: "child",
            });
          }
        });
      }

      // Nearby clinics for clinic pages
      if (pageType === "clinic" && clinicId) {
        const { data: nearbyClinics } = await supabase
          .from("clinics")
          .select("name, slug")
          .neq("id", clinicId)
          .eq("is_active", true)
          .eq("is_suspended", false)
          .limit(4);

        nearbyClinics?.forEach((c, i) => {
          links.push({
            label: pickAnchor("clinic", c.name, i),
            href: `/clinic/${c.slug}/`,
            type: "sibling",
          });
        });
      }

      // Always add insurance and services directory links
      links.push({
        label: "Dental Insurance Plans",
        href: "/insurance/",
        type: "lateral",
      });
      links.push({
        label: "All Dental Services",
        href: "/services/",
        type: "lateral",
      });

      return links;
    },
    staleTime: 5 * 60 * 1000,
  });
}
