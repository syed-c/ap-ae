'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useQuery } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PageLayout } from "@/components/layout/PageLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/seo/SEOHead";
import { SyncStructuredData } from "@/components/seo/SyncStructuredData";
import { InterlinkingSection } from "@/components/seo/InterlinkingSection";
import { RelatedClinicsBlock } from "@/components/seo/RelatedClinicsBlock";
import { useSeoPageContent, parseMarkdownContent, parseFaqFromContent } from "@/hooks/useSeoPageContent";
import { sanitizeCmsHtml } from "@/lib/security/sanitizeCmsHtml";
import {
  ClinicStickyBooking,
  ClinicTeamSection,
  ClaimProfileCTA,
  ClinicGallery,
  ClinicReviewsSection,
  InsuranceTab,
  BeforeAfterGallery,
} from "@/components/clinic";
import {
  Star,
  BadgeCheck,
  Calendar,
  Share2,
  Heart,
  Shield,
  Award,
  Users,
  MapPin,
  Phone,
  Globe,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Percent,
  MessageCircle
} from "lucide-react";
import { AIMatchBadge } from "@/components/ai";
import { TrustSignalStrip, AEDPricingDisplay } from "@/components/healthcare";
import { generateClinicQA } from "@/lib/ai-seo/generateQAContent";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { proxyImageUrl } from "@/lib/proxyImageUrl";

const ConversationalQABlock = dynamic(
  () => import('@/components/ai-seo/ConversationalQABlock').then(m => ({ default: m.ConversationalQABlock })),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded-xl h-48" /> }
);
const AIDiscoveryMeta = dynamic(
  () => import('@/components/ai-seo/AIDiscoveryMeta').then(m => ({ default: m.AIDiscoveryMeta })),
  { ssr: false }
);
const MultiStepBookingModal = dynamic(
  () => import('@/components/MultiStepBookingModal').then(m => ({ default: m.MultiStepBookingModal })),
  { ssr: false }
);
const PromotionBanner = dynamic(
  () => import('@/components/subscription/PromotionBanner').then(m => ({ default: m.PromotionBanner })),
  { ssr: false }
);

interface ClinicPageProps {
  clinicSlugProp?: string;
  clinicDataProp?: any;
  clinicTreatmentsDataProp?: any[];
  dentistsDataProp?: any[];
  reviewsDataProp?: any[];
  googleReviewsDataProp?: any[];
  galleryImagesDataProp?: any[];
  hoursDataProp?: any[];
  seoContentDataProp?: any;
  faqsProp?: { question: string; answer: string }[];
  dehydratedStateProp?: any;
  seoDataProp?: {
    title: string;
    description: string;
    canonical: string;
  };
}

const ClinicPage = ({ clinicSlugProp, clinicDataProp, clinicTreatmentsDataProp, dentistsDataProp, reviewsDataProp, googleReviewsDataProp, galleryImagesDataProp, hoursDataProp, seoContentDataProp, faqsProp, seoDataProp }: ClinicPageProps = {}) => {
  const router = useRouter();
  // Always trust clinicSlugProp for SSR - it's passed from getStaticProps
  // Only fall back to router.query for client-side navigations after initial SSR
  const isServerRender = typeof window === 'undefined';
  const clinicSlug = isServerRender 
    ? (clinicSlugProp || '')
    : (clinicSlugProp || (typeof router.query?.clinicSlug === 'string' ? router.query.clinicSlug : ''));
  const slug = clinicSlug || "";
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDentistId, setSelectedDentistId] = useState<string | undefined>();
  const { trackProfileView } = useAnalytics();

  // SEO content is fetched server-side and passed in to keep clinic body copy crawlable.
  const seoContent = seoContentDataProp || null;
  const parsedContent = seoContent?.content ? parseMarkdownContent(seoContent.content) : null;
  const seoFaqs = (faqsProp && faqsProp.length > 0)
    ? faqsProp.map((faq) => ({ question: faq.question, answer: faq.answer }))
    : (seoContent?.faqs && Array.isArray(seoContent.faqs)
        ? seoContent.faqs.map((faq: any) => ({ question: faq.question || faq.q, answer: faq.answer || faq.a }))
        : (seoContent?.content ? parseFaqFromContent(seoContent.content).map((faq) => ({ question: faq.q, answer: faq.a })) : []));

  // Fetch clinic data - only exact slug match
  const { data: clinic, isLoading, error } = useQuery({
    queryKey: ["clinic", slug],
    queryFn: async () => {
      if (!slug || slug.includes('/')) return null; // Prevent path traversal
      const { data, error } = await supabase
        .from("clinics")
        .select("*, city:cities(name, slug, state:states(name, slug, abbreviation)), area:areas(name, slug)")
        .eq("slug", slug)
        .maybeSingle(); // Use maybeSingle to return null instead of error for no match
      if (error) throw error;
      return data;
    },
    initialData: clinicDataProp,
    enabled: !!slug && !slug.includes('/'),
  });

  // Fetch dentists/team members
  const { data: dentists } = useQuery({
    queryKey: ["clinic-dentists", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data } = await supabase
        .from("dentists")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("name");
      return data || [];
    },
    initialData: dentistsDataProp,
    enabled: !!clinic?.id,
  });

  // Fetch treatments
  const { data: treatments } = useQuery({
    queryKey: ["clinic-treatments", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data } = await supabase
        .from("clinic_treatments")
        .select("*, treatment:treatments(*)")
        .eq("clinic_id", clinic.id);
      return data || [];
    },
    initialData: clinicTreatmentsDataProp,
    enabled: !!clinic?.id,
  });

  // Fetch internal reviews from review_funnel_events
  const { data: reviews } = useQuery({
    queryKey: ["clinic-reviews", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data } = await supabase
        .from("review_funnel_events")
        .select("*")
        .eq("clinic_id", clinic.id)
        .eq("event_type", "rating_submitted")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []).map((r: any) => ({
        id: r.id,
        patient_name: r.visitor_id || 'Anonymous',
        rating: r.rating || 5,
        content: r.comment || '',
        created_at: r.created_at,
        source: 'internal' as const,
      }));
    },
    initialData: reviewsDataProp,
    enabled: !!clinic?.id,
  });

  // Fetch Google reviews
  const { data: googleReviews } = useQuery({
    queryKey: ["clinic-google-reviews", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data } = await supabase
        .from("google_reviews")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("review_time", { ascending: false })
        .limit(20);
      return data || [];
    },
    initialData: googleReviewsDataProp,
    enabled: !!clinic?.id && clinic?.gmb_connected,
  });

  // Fetch gallery images
  const { data: galleryImages } = useQuery({
    queryKey: ["clinic-gallery", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data } = await supabase
        .from("clinic_images")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("display_order");
      return data || [];
    },
    initialData: galleryImagesDataProp,
    enabled: !!clinic?.id,
  });

  // Fetch hours
  const { data: hours } = useQuery({
    queryKey: ["clinic-hours", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data } = await supabase
        .from("clinic_hours")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("day_of_week");
      return data || [];
    },
    initialData: hoursDataProp,
    enabled: !!clinic?.id,
  });

  // Handle booking
  const handleBookClick = (dentistId?: string) => {
    setSelectedDentistId(dentistId);
    setBookingOpen(true);
  };

  // Track profile view in GA4 when clinic data is available
  useEffect(() => {
    if (clinic?.id && clinic?.name) {
      trackProfileView({
        profile_type: 'clinic',
        profile_id: clinic.id,
        profile_name: clinic.name,
        city: clinic.city?.name,
        state: clinic.city?.state?.abbreviation,
      });
    }
  }, [clinic?.id, clinic?.name, clinic?.city?.name, clinic?.city?.state?.abbreviation, trackProfileView]);

  // Check if data is available from server prefetch (even during loading/hydration)
  const hasClinicData = !!clinic;
  const hasSeoContent = !!seoContent;

  // Signal prerender when ALL SEO-critical data is ready
  // This includes clinic data, treatments (for services list) - SEO content handled server-side
  const isDataReady = !isLoading && !!clinic && !!treatments;

  // Build metaDescription from available data
  const fallbackDescription = clinic?.description 
    ? clinic.description.slice(0, 160) 
    : "Find the best dental clinic in UAE. Book appointments with verified dentists and clinics.";

  // Always render SEOHead - use server-side data from getStaticProps
  const seoTitle = seoDataProp?.title 
    ? seoDataProp.title
    : (clinic 
        ? `${clinic.name} - Dental Clinic in ${clinic.city?.name || 'UAE'}`
        : "Dental Clinic");
  const seoDescription = seoDataProp?.description
    ? seoDataProp.description
    : (clinic
        ? (seoContent?.meta_description || fallbackDescription)
        : (seoContent?.meta_description || "Find the best dental clinic"));

  // If no clinic data and still loading, show loading state with SEO
  if (!hasClinicData && isLoading) {
    // If we have server-side SEO data from getStaticProps, render meaningful SSR content
    if (seoDataProp) {
      return (
        <PageLayout>
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
    // Only render visual skeleton for client-side navigations (no server data)
    return (
      <PageLayout>
        <div className="container py-8">
          <Skeleton className="h-80 rounded-3xl mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!clinic) {
    return (
      <PageLayout>
        <Section>
          <SEOHead
            title="Clinic Not Found"
            description="The dental clinic you're looking for doesn't exist or has been removed."
            canonical={`/clinic/${slug}/`}
          />
          <div className="text-center py-20">
            <h1 className="font-display text-3xl font-bold mb-4">Clinic Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The clinic you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild className="rounded-xl font-bold">
              <Link href="/search/">Browse Clinics</Link>
            </Button>
          </div>
        </Section>
      </PageLayout>
    );
  }

  // Determine profile state
  const isClaimed = clinic.claim_status === "claimed";
  const isVerified = clinic.verification_status === "verified" && isClaimed;
  const isGmbConnected = clinic.gmb_connected === true;

  // Get state slug from city data
  const stateSlug = clinic.city?.state?.slug || '';

  // Helper function to truncate description to SEO-friendly length
  const truncateDescription = (text: string | null | undefined, maxLength: number = 155): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    // Truncate at word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  };

  // Generate SEO-optimized meta description
  const metaDescription = seoContent?.meta_description 
    || truncateDescription(clinic.description) 
    || `Book an appointment at ${clinic.name}. ${isVerified ? 'Verified' : ''} dental clinic in ${clinic.city?.name || 'UAE'} with ${dentists?.length || 0} specialists.`;

  const breadcrumbs = [
    { label: "Clinics", href: "/search" },
    ...(clinic.city?.state ? [{ label: clinic.city.state.name, href: `/${clinic.city.state.slug}` }] : []),
    ...(clinic.city ? [{ label: clinic.city.name, href: `/${stateSlug}/${clinic.city.slug}` }] : []),
    { label: clinic.name },
  ];

  return (
    <PageLayout>
      <SEOHead
        title={seoDataProp?.title ?? (clinic ? (seoContent?.meta_title || `${clinic.name} - Dental Clinic in ${clinic.city?.name ?? 'UAE'}`) : (seoContent?.meta_title || "Dental Clinic"))}
        description={seoDataProp?.description ?? (clinic ? (seoContent?.meta_description || metaDescription) : (seoContent?.meta_description || "Find the best dental clinic"))}
        canonical={seoDataProp?.canonical ?? `/clinic/${slug}/`}
        keywords={clinic?.city?.name ? [clinic.name, `dental clinic ${clinic.city.name}`, `dentist in ${clinic.city.state?.abbreviation || 'UAE'}`] : [clinic.name, 'dental clinic UAE', 'dentist UAE']}
      />
      {/* Synchronous JSON-LD structured data for SEO */}
      <SyncStructuredData
        data={[
          {
            type: 'breadcrumb',
            items: [
              { name: 'Home', url: '/' },
              ...(clinic.city?.state?.abbreviation ? [{ name: clinic.city?.state?.name || '', url: `/${clinic.city?.state?.abbreviation.toLowerCase()}/` }] : []),
              ...(clinic.city ? [{ name: clinic.city.name, url: `/${clinic.city?.state?.abbreviation?.toLowerCase() || ''}/${clinic.city.slug}/` }] : []),
              { name: clinic.name },
            ],
          },
          {
            type: 'localBusiness',
            name: clinic.name,
            description: clinic.description || `Professional dental clinic in ${clinic.city?.name || 'UAE'}`,
            address: clinic.address || '',
            city: clinic.city?.name || '',
            state: clinic.city?.state?.abbreviation || '',
            country: 'United Arab Emirates',
            phone: clinic.phone || '',
            url: `/clinic/${clinic.slug}/`,
            geo: clinic.latitude && clinic.longitude ? { lat: Number(clinic.latitude), lng: Number(clinic.longitude) } : undefined,
            rating: clinic.rating ? Number(clinic.rating) : undefined,
            reviewCount: clinic.review_count || undefined,
            priceRange: '75 - 6,000 AED',
            services: (treatments || []).slice(0, 10).map(t => t.treatment?.name).filter(Boolean) as string[],
          },
        ]}
        id="clinic-schema"
      />

      {/* Hero Cover */}
      <div className="relative h-56 md:h-72 bg-muted">
        {clinic.cover_image_url ? (
          <img
            src={proxyImageUrl(clinic.cover_image_url) || clinic.cover_image_url}
            alt={clinic.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple/10 to-gold/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Breadcrumbs */}
        <div className="absolute top-4 left-0 right-0">
          <div className="container">
            <Breadcrumbs items={breadcrumbs} className="text-white/80" />
          </div>
        </div>
      </div>

      {/* Clinic Header Card */}
      <Section size="sm" className="-mt-20 relative z-10">
        <div className="card-modern p-5 md:p-6">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Logo */}
            <div className="shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-card overflow-hidden border-4 border-background shadow-elevated">
                {clinic.cover_image_url ? (
                  <img
                    src={proxyImageUrl(clinic.cover_image_url) || clinic.cover_image_url}
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple/20 flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-primary/50">
                      {clinic.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {isVerified && (
                  <Badge className="bg-primary text-primary-foreground rounded-full px-3 py-1 font-bold">
                    <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                    Verified
                  </Badge>
                )}
                {isClaimed && !isVerified && (
                  <Badge className="bg-gold/10 text-gold border border-gold/20 rounded-full px-3 py-1 font-bold">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    Claimed
                  </Badge>
                )}
                {isGmbConnected && (
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                    <img
                      src="https://www.google.com/favicon.ico"
                      alt="Google"
                      className="h-3 w-3 mr-1"
                    />
                    GMB Synced
                  </Badge>
                )}
                {!isClaimed && (
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-amber-600 border-amber-300">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Unclaimed
                  </Badge>
                )}
              </div>

              {/* Trust Signal Strip */}
              <TrustSignalStrip
                isVerified={isVerified}
                isClaimed={isClaimed}
                isGmbConnected={isGmbConnected}
                reviewCount={clinic.review_count || 0}
                rating={Number(clinic.rating) || 0}
                dentistCount={dentists?.length}
                className="mb-2"
              />

              <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 truncate">
                {clinic.name}
              </h1>

              {/* Rating & Location Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {(Number(clinic.rating) || 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 text-gold">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold">{Number(clinic.rating).toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      ({clinic.review_count || 0})
                    </span>
                  </div>
                )}
                {(clinic.area || clinic.city) && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{clinic.area?.name || clinic.city?.name}</span>
                  </div>
                )}
                {dentists && dentists.length > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{dentists.length} Dentists</span>
                  </div>
                )}
              </div>

              {/* Quick Links - Only for claimed */}
              {isClaimed && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {clinic.phone && (
                    <a
                      href={`tel:${clinic.phone}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {clinic.phone}
                    </a>
                  )}
                  {clinic.website && (
                    <a
                      href={clinic.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                </div>
              )}

              {/* GMB sync info is now shown in the dedicated GMB dashboard */}
            </div>

            {/* Action Buttons - Desktop */}
            <div className="hidden lg:flex flex-col gap-2 shrink-0">
              <Button
                size="lg"
                className="rounded-xl font-bold"
                onClick={() => handleBookClick()}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              {/* WhatsApp Button - Critical for UAE */}
              {clinic?.phone && (
                <a
                  href={`https://wa.me/${clinic.phone.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl font-bold transition-colors"
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'whatsapp_click', {
                        clinic_name: clinic.name,
                        clinic_id: clinic.id,
                        conversion_type: 'whatsapp_booking'
                      });
                    }
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-xl flex-1">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl flex-1">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Promotion Banner - For Dentists */}
      <Section size="sm" className="pt-0">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 p-[2px]">
          <div className="relative rounded-2xl bg-background/95 backdrop-blur-sm px-6 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg">
                      🎉 50% OFF All Plans
                    </h3>
                    <Badge className="bg-red-500 text-white border-0 animate-pulse">
                      Limited Time
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Claim this profile & get 50% off your first month. Verified badge + instant bookings.
                  </p>
                </div>
              </div>
              <Button asChild className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 hover:from-red-600 hover:to-orange-600">
                <Link href="/pricing/">
                  View Plans
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Unclaimed Notice Banner */}
      {!isClaimed && (
        <Section size="sm" className="pt-0">
          <ClaimProfileCTA
            clinicId={clinic.id}
            clinicName={clinic.name}
            variant="banner"
          />
        </Section>
      )}

      {/* Main Content Grid */}
      <Section size="md" className="overflow-x-hidden">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 min-w-0 overflow-hidden">
            <Tabs defaultValue="overview" className="w-full">
              {/* Mobile-optimized scrollable tabs - touch-friendly */}
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide touch-manipulation pb-1">
                <TabsList className="inline-flex w-max md:w-full justify-start bg-muted/50 rounded-2xl p-1 mb-4 md:mb-6">
                  <TabsTrigger value="overview" className="rounded-xl font-bold text-xs px-2.5 py-2 md:text-sm md:px-4 whitespace-nowrap touch-manipulation">Overview</TabsTrigger>
                  <TabsTrigger value="team" className="rounded-xl font-bold text-xs px-2.5 py-2 md:text-sm md:px-4 whitespace-nowrap touch-manipulation">Team</TabsTrigger>
                  <TabsTrigger value="services" className="rounded-xl font-bold text-xs px-2.5 py-2 md:text-sm md:px-4 whitespace-nowrap touch-manipulation">Services</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-xl font-bold text-xs px-2.5 py-2 md:text-sm md:px-4 whitespace-nowrap touch-manipulation">Reviews</TabsTrigger>
                  <TabsTrigger value="insurance" className="rounded-xl font-bold text-xs px-2.5 py-2 md:text-sm md:px-4 whitespace-nowrap touch-manipulation">Insurance</TabsTrigger>
                  <TabsTrigger value="before-after" className="rounded-xl font-bold text-xs px-2.5 py-2 md:text-sm md:px-4 whitespace-nowrap touch-manipulation">Before & After</TabsTrigger>
                  {galleryImages && galleryImages.length > 0 && (
                    <TabsTrigger value="photos" className="rounded-xl font-bold text-xs px-2.5 py-2 md:text-sm md:px-4 whitespace-nowrap touch-manipulation">Photos</TabsTrigger>
                  )}
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" forceMount className="space-y-6 animate-fade-in-up">
                {/* AI Match Badge - Shows why this clinic is a good match */}
                <AIMatchBadge
                  clinicName={clinic.name}
                  location={clinic.city?.name || ''}
                  rating={Number(clinic.rating) || 0}
                  isVerified={isVerified}
                />

                {/* Description - Show optimized SEO content if available */}
                <div className="card-modern p-4 md:p-6 overflow-hidden">
                  <h2 className="font-display text-lg md:text-xl font-bold mb-4">About This Clinic</h2>

                  {/* Use optimized SEO content if available */}
                  {parsedContent && parsedContent.intro ? (
                    <div className="space-y-4 overflow-hidden">
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base break-words">
                        {parsedContent.intro}
                      </p>

                      {/* Render H2/H3 sections from optimized content */}
                      {parsedContent.sections.filter(s => !s.heading.toLowerCase().includes('faq')).slice(0, 3).map((section, idx) => (
                        <div key={idx} className="mt-6 overflow-hidden">
                          {section.level === 2 ? (
                            <h3 className="font-display text-base md:text-lg font-bold text-foreground mb-3">{section.heading}</h3>
                          ) : (
                            <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">{section.heading}</h4>
                          )}
                          <div
                            className="text-muted-foreground leading-relaxed prose prose-sm max-w-none text-sm md:text-base break-words overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(section.content.replace(/\n/g, '<br/>')) }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base break-words">
                      {clinic.description || `${clinic.name} is a dental clinic in ${clinic.area?.name || clinic.city?.name || 'Dubai'}${isClaimed ? ', offering comprehensive dental services with a focus on patient comfort and quality care.' : '. More details will be available once the clinic claims their profile.'}`}
                    </p>
                  )}

                  {!isClaimed && (
                    <div className="mt-4">
                      <ClaimProfileCTA
                        clinicId={clinic.id}
                        clinicName={clinic.name}
                        variant="inline"
                      />
                    </div>
                  )}
                </div>

                {seoFaqs.length > 0 && (
                  <div className="card-modern p-4 md:p-6 overflow-hidden">
                    <h2 className="font-display text-lg md:text-xl font-bold mb-4">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="space-y-3">
                      {seoFaqs.slice(0, 8).map((faq, index) => (
                        <AccordionItem key={index} value={`clinic-faq-${index}`} className="rounded-2xl border border-border px-4">
                          <AccordionTrigger className="text-left font-semibold hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent forceMount className="pb-4 text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {/* AI-Optimized FAQ Section */}
                {seoFaqs.length === 0 && (() => {
                  const clinicQA = generateClinicQA({
                    name: clinic.name,
                    city: clinic.city?.name,
                    area: clinic.area?.name,
                    rating: clinic.rating || clinic.average_rating,
                    reviewCount: clinic.review_count || clinic.total_reviews,
                    treatments: treatments?.map(t => t.treatment?.name).filter(Boolean) as string[],
                  });
                  const allFaqs = seoFaqs.length > 0
                    ? [...seoFaqs.slice(0, 5).map(f => ({ question: f.question, answer: f.answer })), ...clinicQA.slice(0, 2)]
                    : clinicQA;
                  return (
                    <ConversationalQABlock
                      title={`About ${clinic.name}`}
                      subtitle="Common questions patients ask"
                      items={allFaqs}
                      contextLabel={`clinic-${slug}`}
                      className="px-0"
                      defaultOpen={true}
                    />
                  );
                })()}

                {/* Quick Gallery Preview */}
                {galleryImages && galleryImages.length > 0 && (
                  <div className="card-modern p-4 md:p-6 overflow-hidden">
                    <h2 className="font-display text-lg md:text-xl font-bold mb-4">Photos</h2>
                    <ClinicGallery images={galleryImages.slice(0, 4)} clinicName={clinic.name} />
                  </div>
                )}

                {/* Services Preview */}
                {treatments && treatments.length > 0 && (
                  <div className="card-modern p-4 md:p-6 overflow-hidden">
                    <h2 className="font-display text-lg md:text-xl font-bold mb-4">Popular Services</h2>
                    <div className="flex flex-wrap gap-2">
                      {treatments.slice(0, 8).map((ct: any) => {
                        // Build service URL with clinic's city for local relevance
                        // Route: /:stateSlug/:citySlug/:serviceSlug
                        const serviceUrl = clinic.city?.state?.slug && clinic.city?.slug
                          ? `/${clinic.city.state.slug}/${clinic.city.slug}/${ct.treatment?.slug}`
                          : `/services/${ct.treatment?.slug}`;
                        return (
                          <Link
                            key={ct.id}
                            href={serviceUrl}
                            className="px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted hover:text-primary transition-colors max-w-full"
                          >
                            <span className="text-sm font-medium truncate">{ct.treatment?.name}</span>
                          </Link>
                        );
                      })}
                      {treatments.length > 8 && (
                        <Badge variant="secondary" className="rounded-xl">
                          +{treatments.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" forceMount className="animate-fade-in-up">
                <div className="card-modern p-4 md:p-6 overflow-hidden">
                  <h2 className="font-display text-lg md:text-xl font-bold mb-4 md:mb-6">Our Dental Team</h2>
                  <ClinicTeamSection
                    teamMembers={dentists || []}
                    clinicName={clinic.name}
                    onBookWithDentist={(dentistId) => handleBookClick(dentistId)}
                  />
                </div>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" forceMount className="animate-fade-in-up">
                <div className="card-modern p-4 md:p-6 overflow-hidden space-y-6">
                  <h2 className="font-display text-lg md:text-xl font-bold">Services Offered</h2>

                  {/* AED Pricing Display */}
                  {treatments && treatments.length > 0 ? (
                    <AEDPricingDisplay
                      treatments={treatments.map((ct: any) => ({
                        name: ct.treatment?.name || '',
                        slug: ct.treatment?.slug || '',
                        priceAed: ct.price_aed || null,
                      }))}
                      hasInsurance={isClaimed}
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm md:text-base">
                      {isClaimed
                        ? "Contact the clinic for available services."
                        : "Services will be listed once the clinic claims their profile."}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" forceMount className="animate-fade-in-up">
                <div className="card-modern p-4 md:p-6 overflow-hidden">
                  <h2 className="font-display text-lg md:text-xl font-bold mb-4 md:mb-6">Patient Reviews</h2>
                  <ClinicReviewsSection
                    reviews={reviews || []}
                    googleReviews={googleReviews || []}
                    clinicRating={clinic.rating ? Number(clinic.rating) : undefined}
                    clinicReviewCount={clinic.review_count || 0}
                    gmbConnected={isGmbConnected}
                    clinicSlug={clinic.slug}
                    clinicId={clinic.id}
                  />
                </div>
              </TabsContent>

              {/* Insurance Tab */}
              <TabsContent value="insurance" forceMount className="animate-fade-in-up">
                <div className="card-modern p-4 md:p-6 overflow-hidden">
                  <h2 className="font-display text-lg md:text-xl font-bold mb-4 md:mb-6">Insurance & Payment</h2>
                  <InsuranceTab clinicId={clinic.id} isClaimed={isClaimed} />
                </div>
              </TabsContent>

              {/* Before & After Tab */}
              <TabsContent value="before-after" forceMount className="animate-fade-in-up">
                <div className="card-modern p-4 md:p-6 overflow-hidden">
                  <h2 className="font-display text-lg md:text-xl font-bold mb-4 md:mb-6">Treatment Results</h2>
                  <BeforeAfterGallery clinicId={clinic.id} isClaimed={isClaimed} />
                </div>
              </TabsContent>

              {/* Photos Tab */}
              {galleryImages && galleryImages.length > 0 && (
                <TabsContent value="photos" forceMount className="animate-fade-in-up">
                  <div className="card-modern p-4 md:p-6 overflow-hidden">
                    <h2 className="font-display text-lg md:text-xl font-bold mb-4">
                      Gallery ({galleryImages.length} photos)
                    </h2>
                    <ClinicGallery images={galleryImages} clinicName={clinic.name} />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="space-y-6">
            {/* Sticky Booking Widget */}
            <div className="lg:sticky lg:top-24">
              <ClinicStickyBooking
                clinicId={clinic.id}
                clinicName={clinic.name}
                clinicPhone={clinic.phone}
                clinicRating={clinic.rating ? Number(clinic.rating) : undefined}
                clinicReviewCount={clinic.review_count || 0}
                clinicArea={clinic.area?.name || clinic.city?.name}
                clinicLatitude={clinic.latitude ? Number(clinic.latitude) : undefined}
                clinicLongitude={clinic.longitude ? Number(clinic.longitude) : undefined}
                clinicAddress={clinic.address || undefined}
                hours={hours || []}
                teamMembers={dentists || []}
                isClaimed={isClaimed}
              />

              {/* Claim CTA in sidebar for unclaimed */}
              {!isClaimed && (
                <div className="mt-6">
                  <ClaimProfileCTA
                    clinicId={clinic.id}
                    clinicName={clinic.name}
                    variant="sidebar"
                  />
                </div>
              )}

              {/* Related Clinics - Lateral Links */}
              <div className="mt-6">
                <RelatedClinicsBlock
                  clinicId={clinic.id}
                  cityId={clinic.city_id}
                  cityName={clinic.city?.name}
                  citySlug={clinic.city?.slug}
                  stateSlug={clinic.city?.state?.abbreviation?.toLowerCase()}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Internal Linking Section - SEO */}
        <div className="mt-8 max-w-5xl mx-auto px-4">
          <InterlinkingSection
            variant="clinic"
            stateSlug={clinic.city?.state?.abbreviation?.toLowerCase()}
            currentLocationName={clinic.city?.name}
            currentLocationSlug={clinic.city?.slug}
            relatedServices={treatments?.map(t => ({
              name: t.treatment?.name || '',
              slug: t.treatment?.slug || '',
            })).filter(s => s.name) || []}
            nearbyDentists={[]}
          />
        </div>

        {/* Mobile Sticky Book Button */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-40">
          <div className="flex gap-3">
            {/* WhatsApp Button - Critical for UAE */}
            {clinic?.phone && (
              <a
                href={`https://wa.me/${clinic.phone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl font-bold flex-1 transition-colors"
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'whatsapp_click', {
                      clinic_name: clinic.name,
                      clinic_id: clinic.id,
                      conversion_type: 'whatsapp_booking_mobile'
                    });
                  }
                }}
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
            )}
            <Button
              className="flex-1 rounded-xl font-bold h-12 text-base"
              size="lg"
              onClick={() => handleBookClick()}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book Now
            </Button>
          </div>
        </div>
      </Section>

      {/* AI Discovery Meta for AI crawlers */}
      <AIDiscoveryMeta
        pageTitle={clinic.name}
        aiSummary={`${clinic.name} is a dental clinic${clinic.city?.name ? ` in ${clinic.city.name}` : ""}, UAE. ${clinic.rating ? `Rated ${clinic.rating}/5 by ${clinic.review_count || 0} patients.` : ""} Book appointments online through AppointPanda.`}
        entityType="clinic"
        location={{
          city: clinic.city?.name,
          area: clinic.area?.name,
          country: "UAE",
        }}
        url={`/clinic/${slug}/`}
        faqs={generateClinicQA({
          name: clinic.name,
          city: clinic.city?.name,
          area: clinic.area?.name,
          rating: clinic.rating || clinic.average_rating,
          reviewCount: clinic.review_count || clinic.total_reviews,
        })}
      />

      {/* Multi-Step Booking Modal */}
      <MultiStepBookingModal
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        profileId={selectedDentistId || clinic.id}
        profileName={selectedDentistId
          ? dentists?.find(d => d.id === selectedDentistId)?.name || clinic.name
          : clinic.name
        }
        profileType={selectedDentistId ? "dentist" : "clinic"}
        clinicId={clinic.id}
        clinicLatitude={clinic.latitude ? Number(clinic.latitude) : undefined}
        clinicLongitude={clinic.longitude ? Number(clinic.longitude) : undefined}
        clinicAddress={clinic.address || undefined}
      />
    </PageLayout>
  );
};

export default ClinicPage;
