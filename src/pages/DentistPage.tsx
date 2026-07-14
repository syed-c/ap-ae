'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { PageLayout } from "@/components/layout/PageLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { InterlinkingSection } from "@/components/seo/InterlinkingSection";
import { useSeoPageContent } from "@/hooks/useSeoPageContent";
import { MultiStepBookingModal } from "@/components/MultiStepBookingModal";
import { InlineBookingCalendar } from "@/components/booking/InlineBookingCalendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Star,
  BadgeCheck,
  Calendar,
  Share2,
  Heart,
  Award,
  Languages,
  Briefcase,
  Clock,
  Check,
  Copy
} from "lucide-react";
import { TrustSignalStrip, AEDPricingDisplay, CredentialsBadge } from "@/components/healthcare";
import { proxyImageUrl } from "@/lib/proxyImageUrl";

interface TreatmentData {
  id: string;
  treatment_id: string;
  price_from: number | null;
  price_to: number | null;
  treatment: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ReviewData {
  id: string;
  patient_name: string;
  rating: number;
  content: string;
  created_at: string;
}

interface DentistPageProps {
  dentistSlugProp?: string;
  dentistDataProp?: any;
  dehydratedStateProp?: any;
  seoDataProp?: {
    title: string;
    description: string;
    canonical: string;
  };
  treatmentsData?: TreatmentData[];
  reviewsData?: ReviewData[];
}

const DentistPage = ({ dentistSlugProp, dentistDataProp, seoDataProp, treatmentsData, reviewsData }: DentistPageProps = {}) => {
  const router = useRouter();
  const isServerRender = typeof window === 'undefined';
  const dentistSlug = isServerRender
    ? (dentistSlugProp || '')
    : (dentistSlugProp || (typeof router.query?.dentistSlug === 'string' ? router.query.dentistSlug : ''));
  const slug = dentistSlug || "";
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareSuccess, setShareSuccess] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { trackProfileView } = useAnalytics();
  // SEO content is already in seoDataProp from getStaticProps - no client-side fetch needed

  // Fetch dentist data - only exact slug match
  const { data: dentist, isLoading, error } = useQuery({
    queryKey: ["dentist", slug],
    queryFn: async () => {
      if (!slug || slug.includes('/')) return null; // Prevent path traversal
      const { data, error } = await supabase
        .from("dentists")
        .select("*, clinic:clinics(id, name, slug, address, phone, latitude, longitude, city:cities(name, slug, state:states(name, abbreviation, slug)))")
        .eq("slug", slug)
        .maybeSingle(); // Use maybeSingle to return null instead of error for no match
      if (error) throw error;
      return data;
    },
    initialData: dentistDataProp,
    enabled: !!slug && !slug.includes('/'),
  });

  // Use server-side treatments data when available, otherwise fetch client-side
  const { data: treatments } = useQuery({
    queryKey: ["dentist-clinic-treatments", dentist?.clinic_id],
    queryFn: async () => {
      if (!dentist?.clinic_id) return [];
      const { data } = await supabase
        .from("clinic_treatments")
        .select("id, treatment_id, price_from, price_to, treatment:treatments(id, name, slug)")
        .eq("clinic_id", dentist.clinic_id);
      return data || [];
    },
    initialData: treatmentsData,
    enabled: !!dentist?.clinic_id,
  });

  // Use server-side reviews data when available, otherwise fetch client-side
  const { data: reviews } = useQuery({
    queryKey: ["dentist-reviews", dentist?.clinic_id],
    queryFn: async () => {
      if (!dentist?.clinic_id) return [];
      const { data } = await supabase
        .from("review_funnel_events")
        .select("id, rating, comment, created_at, visitor_id")
        .eq("clinic_id", dentist.clinic_id)
        .eq("event_type", "rating_submitted")
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []).map((r: any) => ({
        id: r.id,
        patient_name: r.visitor_id || 'Anonymous',
        rating: r.rating || 5,
        content: r.comment || '',
        created_at: r.created_at,
      }));
    },
    initialData: reviewsData,
    enabled: !!dentist?.clinic_id,
  });

  // Handle share functionality
  const handleShare = async () => {
    const url = window.location.href;
    const title = `${dentist?.name || 'Dentist'} - AppointPanda`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        toast({ title: "Shared successfully!" });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          fallbackCopyToClipboard(url);
        }
      }
    } else {
      fallbackCopyToClipboard(url);
    }
  };

  const fallbackCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareSuccess(true);
      toast({ title: "Link copied to clipboard!" });
      setTimeout(() => setShareSuccess(false), 2000);
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const getLikedDentists = (): string[] => {
    try {
      const stored = localStorage.getItem('likedDentists');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const setLikedDentists = (ids: string[]) => {
    try {
      localStorage.setItem('likedDentists', JSON.stringify(ids));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  };

  // Handle like functionality
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    const likedDentists = getLikedDentists();
    if (isLiked) {
      const updated = likedDentists.filter((id: string) => id !== dentist?.id);
      setLikedDentists(updated);
      toast({ title: "Removed from favorites" });
    } else {
      likedDentists.push(dentist?.id);
      setLikedDentists(likedDentists);
      toast({ title: "Added to favorites!", description: "Find your favorites in your profile" });
    }
  };

  // Check if already liked on mount
  useEffect(() => {
    if (dentist?.id) {
      const likedDentists = getLikedDentists();
      setIsLiked(likedDentists.includes(dentist.id));
    }
  }, [dentist?.id]);

  // Track profile view in GA4 when dentist data is available
  useEffect(() => {
    if (dentist?.id && dentist?.name) {
      trackProfileView({
        profile_type: 'dentist',
        profile_id: dentist.id,
        profile_name: dentist.name,
        city: dentist.clinic?.city?.name,
        state: dentist.clinic?.city?.state?.abbreviation,
      });
    }
  }, [dentist?.id, dentist?.name, dentist?.clinic?.city?.name, dentist?.clinic?.city?.state?.abbreviation, trackProfileView]);

  // Signal prerender when data is ready
  const isDataReady = !isLoading && !!dentist;

  if (isLoading) {
    // If we have server-side SEO data from getStaticProps, render meaningful SSR content
    if (seoDataProp) {
      return (
        <PageLayout>
          <SEOHead
            title={seoDataProp.title}
            description={seoDataProp.description}
            canonical={seoDataProp.canonical}
          />
          <div className="container py-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h1 className="text-2xl md:text-3xl font-display font-bold">{seoDataProp.title}</h1>
                <p className="text-muted-foreground">{seoDataProp.description}</p>
              </div>
            </div>
          </div>
        </PageLayout>
      );
    }
    // Only render visual skeleton for client-side navigations
    return (
      <PageLayout>
        <SEOHead
          title="Loading..."
          description="Loading dentist information..."
        />
        <div className="container py-8">
          <Skeleton className="h-64 rounded-3xl mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!dentist) {
    return (
      <PageLayout>
        <Section>
          <div className="text-center py-20">
            <h1 className="font-display text-3xl font-bold mb-4">Dentist Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The dentist profile you're looking for doesn't exist.
            </p>
            <Button asChild className="rounded-xl font-bold">
              <Link href="/search/">Find Dentists</Link>
            </Button>
          </div>
        </Section>
      </PageLayout>
    );
  }

  const cityName = dentist.clinic?.city?.name || 'Unknown';
  const stateAbbr = dentist.clinic?.city?.state?.abbreviation || '';
  const stateSlug = dentist.clinic?.city?.state?.slug || '';
  const citySlug = dentist.clinic?.city?.slug || '';
  const locationDisplay = dentist.clinic?.city?.state?.name ? `${cityName}, ${dentist.clinic?.city?.state?.name}` : cityName;

  const breadcrumbs = [
    { label: "Dentists", href: "/search" },
    ...(stateSlug ? [{ label: dentist.clinic?.city?.state?.name || '', href: `/${stateSlug}` }] : []),
    ...(citySlug && stateSlug ? [{ label: cityName, href: `/${stateSlug}/${citySlug}` }] : []),
    { label: dentist.name },
  ];

  return (
    <PageLayout>
      <SEOHead
        title={seoDataProp?.title || `${dentist.name}${dentist.title ? `, ${dentist.title}` : ''} - Dentist in ${locationDisplay}`}
        description={seoDataProp?.description || dentist.bio || `Book an appointment with ${dentist.name}. ${dentist.years_experience ? `${dentist.years_experience}+ years of experience.` : ''} Verified dental professional in ${locationDisplay}.`}
        canonical={seoDataProp?.canonical ?? `/dentist/${dentist.slug}/`}
        keywords={[dentist.name, `dentist ${cityName}`, dentist.title || 'dental specialist']}
        ogType="profile"
      />
      <StructuredData
        data={{
          type: 'breadcrumb',
          items: [
            { name: 'Home', url: '/' },
            ...(stateSlug ? [{ name: dentist.clinic?.city?.state?.name || '', url: `/${stateSlug}` }] : []),
            ...(citySlug && stateSlug ? [{ name: cityName, url: `/${stateSlug}/${citySlug}` }] : []),
            { name: dentist.name },
          ],
        }}
      />
      <StructuredData
        data={{
          type: 'person',
          name: dentist.name,
          jobTitle: dentist.title || 'Dental Professional',
          description: dentist.bio || `${dentist.name} is a verified dental professional in ${locationDisplay}.`,
          image: proxyImageUrl(dentist.image_url) || undefined,
          url: `/dentist/${dentist.slug}/`,
          worksFor: dentist.clinic ? { name: dentist.clinic.name, url: `/clinic/${dentist.clinic.slug}/` } : undefined,
        }}
      />
      <MarketplaceHero
        breadcrumbs={breadcrumbs}
        badge="Dentist Profile"
        title={dentist.name}
        description={seoDataProp?.description || dentist.bio || `${dentist.name} is a verified dental professional in ${locationDisplay}.`}
        actions={[
          { href: '#book', label: 'Book Appointment', icon: <Calendar className="h-4 w-4" /> },
          { href: dentist.clinic ? `/clinic/${dentist.clinic.slug}/` : '/search/', label: 'View Clinic', variant: 'outline' },
        ]}
        stats={[
          { label: 'Rating', value: (Number(dentist.rating) || 0) > 0 ? Number(dentist.rating).toFixed(1) : 'New', icon: <Star className="h-5 w-5" /> },
          { label: 'Reviews', value: `${dentist.review_count || 0}`, icon: <Award className="h-5 w-5" /> },
          { label: 'Experience', value: dentist.years_experience ? `${dentist.years_experience}+ yrs` : 'Verified', icon: <Clock className="h-5 w-5" /> },
          { label: 'Location', value: stateAbbr || cityName, icon: <Briefcase className="h-5 w-5" /> },
        ]}
      >
        <div className="marketplace-panel max-w-4xl p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-[1.5rem] border border-border/60 shadow-md md:h-36 md:w-36">
                {dentist.image_url ? (
                  <img
                    src={proxyImageUrl(dentist.image_url) || dentist.image_url}
                    alt={dentist.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-purple/20">
                    <span className="text-4xl font-display font-bold text-primary/50">
                      {dentist.name.split(' ').map((namePart) => namePart[0]).join('')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {dentist.is_active && (
                  <Badge className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 font-bold text-gold">
                    <Award className="mr-1 h-4 w-4" />
                    Active
                  </Badge>
                )}
                {dentist.title && <span className="badge-brand">{dentist.title}</span>}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {dentist.years_experience && (
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {dentist.years_experience}+ years experience
                  </span>
                )}
                {dentist.clinic && (
                  <Link href={`/clinic/${dentist.clinic.slug}/`} className="inline-flex items-center gap-2 hover:text-primary">
                    <Briefcase className="h-4 w-4 text-primary" />
                    {dentist.clinic.name}
                  </Link>
                )}
              </div>

              <TrustSignalStrip
                isVerified={dentist.is_active}
                isClaimed={true}
                reviewCount={dentist.review_count || 0}
                rating={Number(dentist.rating) || 0}
                yearsExperience={dentist.years_experience || undefined}
                className="mt-4"
              />

              <div className="mt-5 flex gap-2">
                <Button id="book" onClick={() => setBookingOpen(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Appointment
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl" onClick={handleShare}>
                  {shareSuccess ? <Check className="h-4 w-4 text-teal" /> : <Share2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-xl ${isLiked ? 'bg-coral/10 border-coral/30' : ''}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-coral text-coral' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MarketplaceHero>

      {/* Content */}
      <Section size="md">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="card-modern p-6">
              <h2 className="font-display text-xl font-bold mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {dentist.bio || `${dentist.name} is a dedicated dental professional committed to providing exceptional patient care. With expertise in various dental procedures and a patient-centered approach, they ensure comfortable and effective treatments.`}
              </p>
            </div>

            {/* Credentials & Qualifications */}
            <CredentialsBadge
              qualifications={dentist.qualifications}
              specializations={dentist.specializations}
              yearsExperience={dentist.years_experience}
              languages={dentist.languages}
            />

            {/* Services with AED Pricing */}
            {treatments && treatments.length > 0 && (
              <div className="card-modern p-6">
                <AEDPricingDisplay
                  treatments={treatments.map((dt: any) => ({
                    name: dt.treatment?.name || '',
                    slug: dt.treatment?.slug || '',
                    priceAed: dt.price_from || dt.price_to || null,
                  }))}
                />
              </div>
            )}

            {/* Reviews */}
            <div className="card-modern p-6">
              <h2 className="font-display text-xl font-bold mb-4">Patient Reviews</h2>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary">
                            {review.patient_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold">{review.patient_name}</p>
                          <div className="flex items-center gap-1 text-gold text-sm">
                            {[...Array(review.rating || 5)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.content && (
                        <p className="text-muted-foreground">{review.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No reviews yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clinic Card */}
            {dentist.clinic && (
              <div className="card-modern p-6">
                <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Works At
                </h3>
                <Link
                  href={`/clinic/${dentist.clinic.slug}/`}
                  className="block p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-bold text-lg">{dentist.clinic.name}</p>
                  {dentist.clinic.city && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {locationDisplay}
                    </p>
                  )}
                </Link>
              </div>
            )}

            {/* Inline Booking Calendar */}
            <div className="lg:sticky lg:top-24">
              <InlineBookingCalendar
                profileId={dentist.id}
                profileName={dentist.name}
                profileType="dentist"
                clinicId={dentist.clinic_id || undefined}
                clinicLatitude={dentist.clinic?.latitude ? Number(dentist.clinic.latitude) : undefined}
                clinicLongitude={dentist.clinic?.longitude ? Number(dentist.clinic.longitude) : undefined}
                clinicAddress={dentist.clinic?.address || undefined}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Interlinking Section */}
      <Section size="md">
        <InterlinkingSection
          variant="dentist"
          currentLocationName={cityName}
          currentLocationSlug={citySlug}
          citySlug={stateSlug ? `${stateSlug}/${citySlug}` : citySlug}
          relatedServices={(treatments || []).map(t => ({
            name: t.treatment?.name || '',
            slug: t.treatment?.slug || ''
          })).filter(t => t.name)}
        />
      </Section>

      {/* Multi-Step Booking Modal */}
      <MultiStepBookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        profileId={dentist.id}
        profileName={dentist.name}
        profileType="dentist"
        clinicId={dentist.clinic_id || undefined}
        clinicLatitude={dentist.clinic?.latitude ? Number(dentist.clinic.latitude) : undefined}
        clinicLongitude={dentist.clinic?.longitude ? Number(dentist.clinic.longitude) : undefined}
        clinicAddress={dentist.clinic?.address || undefined}
      />
    </PageLayout>
  );
};

export default DentistPage;
