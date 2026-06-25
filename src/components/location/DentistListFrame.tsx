'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Search, ShieldCheck, Users, X } from 'lucide-react';

import { ProfileCard } from '@/components/ProfileCard';
import { Button } from '@/components/ui/button';

interface DentistListFrameProps {
  profiles: any[];
  isLoading: boolean;
  locationName: string;
  stateSlug?: string;
  nearbyLocations?: { name: string; slug: string }[];
  emptyMessage?: string;
  showFilters?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  maxHeight?: number;
  initialCount?: number;
}

export const DentistListFrame = ({
  profiles,
  isLoading,
  locationName,
  stateSlug = '',
  nearbyLocations = [],
  emptyMessage,
  hasActiveFilters = false,
  onClearFilters,
  initialCount = 6,
}: DentistListFrameProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleProfiles = isExpanded ? profiles : profiles.slice(0, initialCount);
  const hasMoreProfiles = profiles.length > initialCount;
  const remainingCount = profiles.length - initialCount;

  if (isLoading) {
    return (
      <section className="marketplace-panel overflow-hidden" aria-busy="true">
        <div className="border-b border-border/60 bg-muted/35 px-5 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black text-foreground">Dental providers in {locationName}</h2>
          </div>
        </div>
        <div className="grid gap-4 p-5 md:p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="h-24 w-24 rounded-[1.25rem] bg-muted animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-28 rounded-full bg-muted animate-pulse" />
                  <div className="h-7 w-3/5 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-2/5 rounded-full bg-muted animate-pulse" />
                  <div className="h-10 w-40 rounded-2xl bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <section className="marketplace-panel overflow-hidden">
        <div className="border-b border-border/60 bg-muted/35 px-5 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black text-foreground">Marketplace results</h2>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-dashed border-border bg-muted/25 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-2xl font-black text-foreground">No providers match this view yet</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {emptyMessage ||
                (hasActiveFilters
                  ? 'Try relaxing your filters to discover more clinics and dentists.'
                  : `We are still expanding coverage in ${locationName}.`)}
            </p>

            {nearbyLocations.length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Nearby Areas
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {nearbyLocations.slice(0, 6).map((location) => (
                    <Link
                      key={location.slug}
                      href={stateSlug ? `/${stateSlug}/${location.slug}/` : `/${location.slug}/`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {location.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && onClearFilters && (
              <Button variant="outline" className="mt-6" onClick={onClearFilters}>
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="marketplace-panel overflow-hidden">
      <div className="border-b border-border/60 bg-muted/35 px-5 py-4 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Marketplace Listings</span>
            </div>
            <h2 className="mt-2 text-xl font-black text-foreground md:text-2xl">
              Dentists and clinics in {locationName}
            </h2>
          </div>
          <div className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-medium text-muted-foreground">
            {profiles.length} result{profiles.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5 md:p-6">
        {visibleProfiles.map((profile) => (
          <article key={profile.id} itemScope itemType="https://schema.org/Dentist" className="contents">
            <ProfileCard profile={profile} variant="list" />
            <meta itemProp="name" content={profile.name} />
            {profile.location && <meta itemProp="address" content={profile.location} />}
          </article>
        ))}
      </div>

      {hasMoreProfiles && (
        <div className="border-t border-border/60 bg-muted/20 px-5 py-4 md:px-6">
          <Button variant="outline" className="w-full" onClick={() => setIsExpanded((expanded) => !expanded)}>
            {isExpanded ? 'Show Less' : `View ${remainingCount} More Providers`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
};

export default DentistListFrame;
