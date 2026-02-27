/**
 * RelatedClinicsBlock - Shows nearby/related clinics for lateral linking
 * 
 * Fetches clinics in the same city for cross-linking, preventing
 * orphan pages and distributing link equity.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Building2, Star, ArrowRight } from "lucide-react";

interface RelatedClinicsBlockProps {
  clinicId: string;
  cityId?: string | null;
  cityName?: string;
  citySlug?: string;
  stateSlug?: string;
  limit?: number;
}

export function RelatedClinicsBlock({
  clinicId,
  cityId,
  cityName,
  citySlug,
  stateSlug,
  limit = 4,
}: RelatedClinicsBlockProps) {
  const { data: relatedClinics } = useQuery({
    queryKey: ["related-clinics", clinicId, cityId],
    queryFn: async () => {
      const query = supabase
        .from("clinics")
        .select("id, name, slug, rating, review_count")
        .neq("id", clinicId)
        .eq("is_active", true)
        .eq("is_suspended", false)
        .order("rating", { ascending: false })
        .limit(limit);

      if (cityId) {
        query.eq("city_id", cityId);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000,
  });

  if (!relatedClinics?.length) return null;

  return (
    <div className="card-modern p-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        {cityName ? `Other Clinics in ${cityName}` : "Related Clinics"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {relatedClinics.map((clinic) => (
          <Link
            key={clinic.id}
            to={`/clinic/${clinic.slug}/`}
            className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/30 transition-all group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">
                {clinic.name}
              </p>
              {clinic.rating > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3 w-3 text-gold fill-gold" />
                  <span className="text-xs text-muted-foreground">
                    {Number(clinic.rating).toFixed(1)} ({clinic.review_count} reviews)
                  </span>
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
          </Link>
        ))}
      </div>
      {citySlug && stateSlug && (
        <Link
          to={`/${stateSlug}/${citySlug}/`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-4"
        >
          View all clinics in {cityName} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
