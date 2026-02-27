'use client';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileCard } from "@/components/ProfileCard";
import { MobileDentistSlider } from "@/components/lists/MobileDentistSlider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronDown, 
  ChevronUp, 
  Users, 
  MapPin,
  X
} from "lucide-react";

interface DentistListFrameProps {
  profiles: any[];
  isLoading: boolean;
  locationName: string;
  emptyMessage?: string;
  showFilters?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  /** Max height of the scrollable container (in px). Default: 600 */
  maxHeight?: number;
  /** Initial number of profiles to show before expand. Default: 6 */
  initialCount?: number;
}

/**
 * DentistListFrame - A scrollable container for dentist profiles
 * with a proper frame, expand/collapse functionality, and SEO-friendly rendering.
 * Content is rendered as real HTML for Google bots.
 */
export const DentistListFrame = ({
  profiles,
  isLoading,
  locationName,
  emptyMessage,
  showFilters = false,
  hasActiveFilters = false,
  onClearFilters,
  maxHeight = 600,
  initialCount = 6,
}: DentistListFrameProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayProfiles = isExpanded ? profiles : profiles.slice(0, initialCount);
  const hasMoreProfiles = profiles.length > initialCount;
  const remainingCount = profiles.length - initialCount;

  if (isLoading) {
    return (
      <div 
        className="bg-card border border-border rounded-3xl overflow-hidden"
        itemScope 
        itemType="https://schema.org/ItemList"
        aria-busy="true"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg" itemProp="name">
                Dentists in {locationName}
              </h3>
            </div>
            <span className="text-sm text-muted-foreground">Loading results...</span>
          </div>
        </div>
        {/* SEO: Always render semantic content structure for bots */}
        <p className="sr-only" itemProp="description">
          Browse verified dental professionals in {locationName}. Find ratings, reviews, and book appointments online.
        </p>
        <div className="p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted/50 border border-border rounded-2xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="bg-card border border-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Dentists & Clinics</h3>
          </div>
        </div>
        <div className="p-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No dentists found</h3>
          <p className="text-muted-foreground mb-4">
            {emptyMessage || (hasActiveFilters 
              ? "Try adjusting your filters to see more results."
              : `We're still adding dentists in ${locationName}. Check back soon!`
            )}
          </p>
          {hasActiveFilters && onClearFilters && (
            <Button 
              variant="outline" 
              className="rounded-xl"
              onClick={onClearFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Dentists in {locationName}</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {profiles.length} {profiles.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
      
      {/* SEO: Semantic HTML list always in DOM for bots/crawlers */}
      <noscript>
        <div itemScope itemType="https://schema.org/ItemList">
          <meta itemProp="name" content={`Dentists in ${locationName}`} />
          <meta itemProp="numberOfItems" content={String(profiles.length)} />
          {profiles.map((profile, index) => (
            <div key={profile.id} itemScope itemType="https://schema.org/Dentist" itemProp="itemListElement">
              <meta itemProp="position" content={String(index + 1)} />
              <h4 itemProp="name">{profile.name}</h4>
              {profile.location && <p itemProp="address">{profile.location}</p>}
              {profile.specialty && <p itemProp="medicalSpecialty">{profile.specialty}</p>}
              {profile.rating && <span itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                <meta itemProp="ratingValue" content={String(profile.rating)} />
                <meta itemProp="reviewCount" content={String(profile.review_count || 0)} />
                <meta itemProp="bestRating" content="5" />
                <meta itemProp="worstRating" content="1" />
              </span>}
              {profile.slug && <a itemProp="url" href={`https://www.appointpanda.ae/clinic/${profile.slug}/`}>View Profile</a>}
            </div>
          ))}
        </div>
      </noscript>

      {/* Screen-reader / bot-accessible semantic list (visually hidden but in DOM) */}
      <div className="sr-only" role="list" aria-label={`${profiles.length} dentists in ${locationName}`}
        itemScope itemType="https://schema.org/ItemList">
        <meta itemProp="name" content={`Dentists in ${locationName}`} />
        <meta itemProp="numberOfItems" content={String(profiles.length)} />
        {profiles.map((profile, index) => (
          <div key={profile.id} role="listitem" itemScope itemType="https://schema.org/Dentist" itemProp="itemListElement">
            <meta itemProp="position" content={String(index + 1)} />
            <span itemProp="name">{profile.name}</span>
            {profile.location && <span itemProp="address">{profile.location}</span>}
            {profile.specialty && <span itemProp="medicalSpecialty">{profile.specialty}</span>}
            {profile.rating && <span itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
              <meta itemProp="ratingValue" content={String(profile.rating)} />
              <meta itemProp="reviewCount" content={String(profile.review_count || 0)} />
              <meta itemProp="bestRating" content="5" />
              <meta itemProp="worstRating" content="1" />
            </span>}
            {profile.slug && <a itemProp="url" href={`https://www.appointpanda.ae/clinic/${profile.slug}/`}>{profile.name}</a>}
          </div>
        ))}
      </div>

      {/* Scrollable Content Frame */}
      <div className="relative">
        {/* Mobile: Horizontal slider */}
        <div className="md:hidden p-4">
          <MobileDentistSlider profiles={displayProfiles} />
        </div>
        
        {/* Desktop: Scrollable list */}
        <div className="hidden md:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={isExpanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ScrollArea 
                className="w-full"
                style={{ maxHeight: isExpanded ? 'none' : `${maxHeight}px` }}
              >
                <div className="p-4 md:p-6 space-y-4">
                  {displayProfiles.map((profile, index) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <article 
                        itemScope 
                        itemType="https://schema.org/Dentist"
                        className="contents"
                      >
                        <ProfileCard profile={profile} variant="list" />
                        <meta itemProp="name" content={profile.name} />
                        {profile.location && (
                          <meta itemProp="address" content={profile.location} />
                        )}
                      </article>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          </AnimatePresence>
          
          {/* Gradient fade at bottom when collapsed */}
          {!isExpanded && hasMoreProfiles && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>
      </div>
      
      {/* Expand/Collapse Footer */}
      {hasMoreProfiles && (
        <div className="p-4 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            className="w-full rounded-xl font-bold hover:bg-primary/10 transition-colors group"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                View All {remainingCount} More Dentists
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DentistListFrame;
