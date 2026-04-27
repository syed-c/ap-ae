'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabaseAdmin } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";

import { useProfiles } from "@/hooks/useProfiles";
import { SEOHead } from "@/components/seo/SEOHead";
import { SyncStructuredData } from "@/components/seo/SyncStructuredData";
import { useState as useStateData, useCity } from "@/hooks/useLocations";
import { parseFaqFromContent } from "@/hooks/useSeoPageContent";
import { normalizeStateSlug } from "@/lib/slug/normalizeStateSlug";

import { 
  Star,
  Search,
  Verified,
  CheckCircle,
  XCircle,
  Settings,
  Sparkles,
  Menu,
  ChevronDown,
  Calendar,
  MapPin,
  CreditCard,
  BadgeCheck,
  Smile,
  Shield,
  Phone,
  ChevronRight,
  Grid3X3
} from "lucide-react";

interface ServiceLocationPageProps {
  stateSlugProp?: string;
  citySlugProp?: string;
  serviceSlugProp?: string;
  stateDataProp?: any;
  cityDataProp?: any;
  treatmentDataProp?: any;
  seoDataProp?: { title: string | null; description: string | null; canonical: string };
  dehydratedStateProp?: any;
  faqsProp?: { question: string; answer: string }[];
  seoH1Prop?: string | null;
  heroIntroProp?: string | null;
  contentProp?: string | null;
  // Price & clinical data from DB
  priceMinProp?: number | null;
  priceMaxProp?: number | null;
  priceNoteProp?: string | null;
  quickAnswerProp?: string | null;
  lastReviewedByProp?: string | null;
  expertCredentialProp?: string | null;
  medicalAccuracyVerifiedProp?: boolean;
  // Process & options
  processStepsProp?: any[] | null;
  treatmentOptionsProp?: any[] | null;
  benefitsProp?: any[] | null;
  candidatesProp?: any[] | null;
  alternativesProp?: any[] | null;
  relatedQuestionsProp?: any[] | null;
  processTimeMonthsProp?: string | null;
  processTimeNoteProp?: string | null;
  allSeoDataProp?: any;
  clinicProfilesProp?: any[];
}

const ServiceLocationPage = ({ 
  stateSlugProp, citySlugProp, serviceSlugProp, 
  stateDataProp, cityDataProp, treatmentDataProp, 
  seoDataProp, allSeoDataProp,
  heroIntroProp,
  contentProp,
  priceMinProp,
  priceMaxProp,
  priceNoteProp,
  quickAnswerProp,
  lastReviewedByProp,
  expertCredentialProp,
  medicalAccuracyVerifiedProp,
  processStepsProp,
  treatmentOptionsProp,
  benefitsProp,
  candidatesProp,
  alternativesProp,
  relatedQuestionsProp,
  processTimeMonthsProp,
  processTimeNoteProp,
  clinicProfilesProp,
}: ServiceLocationPageProps) => {
  const routerQuery = useRouter().query;
  const stateSlug = stateSlugProp || routerQuery.stateSlug as string || '';
  const citySlug = citySlugProp || routerQuery.citySlug as string || '';
  const serviceSlug = serviceSlugProp || routerQuery.serviceSlug as string || '';
  const normalizedStateSlug = normalizeStateSlug(stateSlug);
  const service = serviceSlug || "";

  const { data: state } = useStateData(normalizedStateSlug || '', stateDataProp);
  const { data: city } = useCity(citySlug || '', normalizedStateSlug || '', cityDataProp);

  // SEO content is loaded server-side via getStaticProps - no client-side fetch needed
  // This prevents any "flash of fallback content" - all content is in the initial HTML
  // allSeoDataProp comes from getStaticProps and contains all SEO content from DB
  const seoContent = allSeoDataProp;
  const seoContentLoading = false;
  const seoContentFetching = false;

  const { data: treatment } = useQuery({
    queryKey: ["treatment", service],
    queryFn: async () => {
      const { data } = await supabaseAdmin.from("treatments").select("*").eq("slug", service).maybeSingle();
      return data;
    },
    enabled: !!service,
    initialData: treatmentDataProp || undefined,
  });

  const [profilesData] = useState(() =>
    clinicProfilesProp
      ? clinicProfilesProp.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: c.type,
          specialty: 'Dental Clinic',
          rating: c.rating,
          reviewCount: c.review_count,
          image: c.image_url,
          isVerified: c.is_verified,
          isClaimed: c.is_claimed,
          isPinned: c.is_pinned,
          location: c.location,
          cityId: c.city_id,
          languages: c.languages,
        }))
      : []
  );
  const profiles = profilesData;

  const { data: allCitiesInEmirate } = useQuery({
    queryKey: ['cities-by-emirate', normalizedStateSlug],
    queryFn: async () => {
      const { data: stateData } = await supabaseAdmin.from('states').select('id').eq('slug', normalizedStateSlug).eq('is_active', true).maybeSingle();
      if (!stateData) return [];
      const { data: citiesData } = await supabaseAdmin.from('cities').select('id, name, slug, image_url').eq('state_id', stateData.id).eq('is_active', true).order('population', { ascending: false });
      return citiesData || [];
    },
    enabled: !!normalizedStateSlug,
  });

  const locationName = city?.name || citySlug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || '';
  const stateName = state?.name || '';
  const treatmentName = treatment?.name || service.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const router = useRouter();

  if (stateSlug && normalizedStateSlug && stateSlug !== normalizedStateSlug && citySlug && serviceSlug) {
    return router.replace(`/${normalizedStateSlug}/${citySlug}/${serviceSlug}/`);
  }

  // Get ALL data from DB - PRIORITIZE server-side props for SEO
  // Server-side data (allSeoDataProp) comes from getStaticProps - Google can see this!
  // Client-side only is fallback
  const seoDataFromProps = allSeoDataProp || seoContent;
  
  // H1 from DB
  const displayH1 = seoDataFromProps?.h1 || seoDataFromProps?.title || `Best ${treatmentName} in ${locationName}`;
  
  // Page intro from DB (for hero) - use server-side prop first
  const pageIntro = heroIntroProp || seoDataFromProps?.page_intro || null;
  
  // Content from DB - combine server-side content with DB content
  const pageContent = contentProp || seoDataFromProps?.content || null;
  
  // FAQs from DB
  const seoFaqs = seoDataFromProps?.faqs && Array.isArray(seoDataFromProps.faqs) && seoDataFromProps.faqs.length > 0
    ? seoDataFromProps.faqs
    : seoDataFromProps?.content ? parseFaqFromContent(seoDataFromProps.content) : [];

  const faqs = seoFaqs.length > 0 ? seoFaqs : [
    { q: `Where can I find ${treatmentName} specialists in ${locationName}?`, a: `We have ${profiles?.length || 0}+ verified specialists in ${locationName}.` },
    { q: `How much does ${treatmentName} cost in ${locationName}?`, a: `Prices vary by clinic. Book a consultation for accurate quotes.` },
    { q: `Are the dentists in ${locationName} verified?`, a: `All dentists are licensed and verified.` },
    { q: `How do I book an appointment?`, a: `Click "Book Now" on any profile to book.` },
  ];

  // Pricing from DB - prioritize server-side props
  const priceMin = priceMinProp ?? seoDataFromProps?.price_min ?? null;
  const priceMax = priceMaxProp ?? seoDataFromProps?.price_max ?? null;
  const priceNote = priceNoteProp ?? seoDataFromProps?.price_note ?? null;
  
  // Quick answer & credentials
  const quickAnswer = quickAnswerProp ?? seoDataFromProps?.quick_answer ?? null;
  const lastReviewedBy = lastReviewedByProp ?? seoDataFromProps?.last_reviewed_by ?? null;
  const expertCredential = expertCredentialProp ?? seoDataFromProps?.expert_credential ?? null;
  const medicalAccuracyVerified = medicalAccuracyVerifiedProp ?? seoDataFromProps?.medical_accuracy_verified ?? false;
  
  // Process & clinical data
  const processSteps = processStepsProp ?? seoDataFromProps?.process_steps ?? null;
  const treatmentOptions = treatmentOptionsProp ?? seoDataFromProps?.treatment_options ?? null;
  const benefits = benefitsProp ?? seoDataFromProps?.benefits ?? null;
  const candidates = candidatesProp ?? seoDataFromProps?.candidates ?? null;
  const alternatives = alternativesProp ?? seoDataFromProps?.alternatives ?? null;
  const relatedQuestions = relatedQuestionsProp ?? seoDataFromProps?.related_questions ?? null;
  const processTimeMonths = processTimeMonthsProp ?? seoDataFromProps?.process_time_months ?? null;
  const processTimeNote = processTimeNoteProp ?? seoDataFromProps?.process_time_note ?? null;
  
  // Treatment options from DB for pricing cards (use existing data)
  const treatmentOptionsData = treatmentOptions || [];
  
  // Benefits from DB
  const benefitsData = benefits || [];
  
  // Candidates (Recommended For) from DB - extract descriptions
  const dbCandidates = candidates || [];
  const candidateItems = dbCandidates.map((item: any) => item.description || item).filter(Boolean);
  
  // Alternatives (May Not Be Suitable) from DB - extract reasons
  const dbAlternatives = alternatives || [];
  const alternativeItems = dbAlternatives.map((item: any) => item.reason || item.name || item).filter(Boolean);
  
  // Medical verification info from DB
  const medicalVerified = medicalAccuracyVerified || false;

  const cities = allCitiesInEmirate || [];
  const hasProfiles = (profiles || []).length > 0;

  // Dynamic doctor profiles from DB
  const topDoctors = (profiles || []).slice(0, 4).map((profile) => ({
    name: profile.name || "Dr. Unknown",
    specialty: profile.specialty || "Dental Specialist",
    rating: profile.rating || 4.5,
    reviewCount: profile.reviewCount || 0,
    availability: profile.isVerified ? "Verified" : "Available",
    image: profile.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop",
    languages: profile.languages || ["English", "Arabic"],
  }));

  // Dynamic cost cards from DB treatment_options or fallback to price_min/max
  const costCards = treatmentOptionsData && treatmentOptionsData.length > 0 
    ? treatmentOptionsData.slice(0, 4).map((opt: any) => ({
      name: opt.name || opt.type || "Treatment",
      price: opt.price_max ? `AED ${opt.price_max}+` : opt.price_min ? `AED ${opt.price_min}+` : "AED 500+",
      icon: opt.icon || "medical_services"
    }))
    : [
      { name: "Check-up", price: priceMin ? `AED ${priceMin}+` : "AED 350+", icon: "medical_services" },
      { name: treatmentName || "Whitening", price: priceMax ? `AED ${priceMax}+` : "AED 1,200+", icon: "auto_fix_high" },
      { name: "Scaling & Polishing", price: "AED 450+", icon: "settings_accessibility" },
      { name: "Consultation", price: "AED 200+", icon: "clinical_notes" },
    ];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Desktop Layout - FULL WIDTH, DB POWERED
  const DesktopLayout = () => (
    <div className="hidden lg:block">
      {/* HERO - with DB page_intro */}
      <header className="relative h-[85vh] flex items-center overflow-hidden bg-[#0e0e0e] mx-4 mb-4 rounded-[3rem]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-full h-full border-r border-b border-white/10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full rotate-45" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full -rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto w-full text-center space-y-12 p-8 md:p-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#73ebdc] mx-auto">
            <Verified className="text-sm h-4 w-4" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Verified Provider Directory</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-4xl mx-auto">
              {displayH1}
            </h1>
          </div>
          
          {/* Search Interface */}
          <div className="bg-white/10 border border-white/20 p-2 rounded-[2.5rem] shadow-2xl max-w-4xl mx-auto backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 rounded-full transition-colors cursor-pointer group">
                <Grid3X3 className="text-[#73ebdc] group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Specialization</label>
                  <span className="text-white font-semibold">{treatmentName}</span>
                </div>
                <ChevronDown className="text-white/20 ml-auto h-4 w-4" />
              </div>
              <div className="hidden md:block w-px h-10 bg-white/10" />
              <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 rounded-full transition-colors cursor-pointer group">
                <MapPin className="text-[#73ebdc] group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Neighborhood</label>
                  <span className="text-white font-semibold">{locationName}</span>
                </div>
                <ChevronDown className="text-white/20 ml-auto h-4 w-4" />
              </div>
              <div className="hidden md:block w-px h-10 bg-white/10" />
              <div className="flex-1 w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 rounded-full transition-colors cursor-pointer group">
                <Shield className="text-[#73ebdc] group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Insurance</label>
                  <span className="text-white font-semibold">All Providers</span>
                </div>
                <ChevronDown className="text-white/20 ml-auto h-4 w-4" />
              </div>
              <button className="w-full md:w-auto px-10 py-5 bg-[#73ebdc] text-[#004842] font-black rounded-[2rem] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 m-1">
                <Search className="h-5 w-5" />
                Find Specialist
              </button>
            </div>
          </div>
          
          {/* Trust Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white">{profiles?.length || 0}+</span>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Verified<br/>Clinics</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white">{profiles?.length * 2 || 0}+</span>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Active<br/>Specialists</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white">4.9/5</span>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Patient<br/>Rating</span>
            </div>
          </div>
        </div>
      </header>

      {/* ESTIMATED CARE COSTS - from DB treatment_options/price_min/price_max */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-[#2f2f2e]">Transparent Care Costs</h2>
              <p className="text-[#5c5b5b] max-w-xl">Quality dental care shouldn't be a mystery. We provide estimated costs based on {locationName} market standards.</p>
            </div>
            <CreditCard className="text-[#00675f] h-12 w-12" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {costCards.map((card: any, i: number) => (
              <div key={i} className="group bg-[#f3f0ef] p-8 rounded-[2rem] hover:bg-white transition-all duration-300 border border-transparent hover:border-[#00675f]/10">
                {card.icon === 'medical_services' && <BadgeCheck className="text-[#00675f] mb-6 text-3xl" />}
                {card.icon === 'dentistry' && <Smile className="text-[#00675f] mb-6 text-3xl" />}
                {card.icon === 'auto_fix_high' && <Sparkles className="text-[#00675f] mb-6 text-3xl" />}
                {card.icon === 'settings_accessibility' && <Settings className="text-[#00675f] mb-6 text-3xl" />}
                {card.icon === 'clinical_notes' && <BadgeCheck className="text-[#00675f] mb-6 text-3xl" />}
                <h3 className="font-bold text-xl mb-2 text-[#2f2f2e]">{card.name}</h3>
                <p className="text-[#5c5b5b] text-sm mb-6">Comprehensive assessment and treatment.</p>
                <div className="text-3xl font-black text-[#2f2f2e]">{card.price} <span className="text-xs font-medium text-[#5c5b5b]">Avg.</span></div>
              </div>
            ))}
            
          </div>
        </div>
      </section>

      {/* TOP-RATED SPECIALISTS - from DB profiles */}
      {hasProfiles && (
      <section className="bg-[#f3f0ef] py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight">World-Class Specialists</h2>
            <button className="flex items-center gap-2 text-[#00675f] font-bold hover:translate-x-2 transition-transform">
              View All Dentists <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {topDoctors.map((doctor: any, i: number) => (
              <div key={i} className="flex gap-8 p-8 bg-white rounded-[2.5rem] items-center group">
                <div className="w-48 h-64 rounded-[2rem] overflow-hidden relative flex-shrink-0">
                  <img alt={doctor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={doctor.image} />
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-2 text-[#00675f]">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-sm">{doctor.rating} ({doctor.reviewCount}+ Reviews)</span>
                  </div>
                  <h3 className="text-3xl font-bold text-[#2f2f2e]">{doctor.name}</h3>
                  <p className="text-[#5c5b5b] font-medium">{doctor.specialty}</p>
                  <p className="text-sm leading-relaxed text-[#5c5b5b]/80">Expert in delivering precise dental care with cutting-edge technology.</p>
                  <div className="pt-4 flex gap-3">
                    {doctor.languages.map((lang: string, j: number) => (
                      <span key={j} className="px-3 py-1 bg-[#f3f0ef] rounded-full text-[10px] font-bold uppercase tracking-wider">{lang}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* CONCIERGE JOURNEY - from DB process_steps */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4">The Concierge Journey</h2>
            <p className="text-[#5c5b5b]">Three simple steps to your new architectural smile.</p>
          </div>
          <div className="relative grid md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-[#dedcdb] z-0" />
            {(processSteps && processSteps.length > 0 ? processSteps : [
              { step: "01", title: "Find", desc: `Select your preferred specialist in ${locationName}.` },
              { step: "02", title: "Choose", desc: "Pick a time that fits your urban lifestyle." },
              { step: "03", title: "Register", desc: "Simple digital onboarding. No paperwork." },
            ]).map((item: any, i: number) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 rounded-[2rem] bg-white border-4 border-[#f3f0ef] shadow-xl flex items-center justify-center text-[#00675f] hover:bg-[#00675f] hover:text-white transition-all">
                  {i === 0 && <Search className="text-4xl" />}
                  {i === 1 && <Calendar className="text-4xl" />}
                  {i === 2 && <BadgeCheck className="text-4xl" />}
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-2">{item.title || item.name}</h4>
                  <p className="text-sm text-[#5c5b5b]">{item.desc || item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECISION SECTION (DARK) - DB content + verification info */}
      <section className="bg-[#0e0e0e] text-white py-24 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">Precision in the Heart of <span className="text-[#73ebdc]">{locationName}.</span></h2>
            {pageContent ? (
              <div className="text-white/60 text-lg leading-relaxed whitespace-pre-line">
                {pageContent.split('\n').slice(1).join('\n')}
              </div>
            ) : (
              <p className="text-white/60 text-lg leading-relaxed">
                Located amidst the bustling district of {locationName}, our curated dental network represents the pinnacle of {stateName}'s medical landscape. We hand-select practices that demonstrate not only clinical excellence but also an architectural approach to patient comfort.
              </p>
            )}
            {/* Content You Can Trust - from DB medical verification fields */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[#73ebdc]/20 flex flex-shrink-0 items-center justify-center text-[#73ebdc]">
                <Shield className="text-3xl" />
              </div>
              <div>
                <h4 className="font-bold text-xl mb-2 text-white">Content You Can Trust</h4>
                <p className="text-white/60 text-sm">
                  {expertCredential ? `Content verified by ${expertCredential}. ` : 'Every clinic listing and specialist profile undergoes a rigorous 20-point verification process. '}
                  {medicalVerified ? 'Medical accuracy verified by our editorial team.' : 'Our editorial team updates pricing and availability daily.'}
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <div className="bg-[#00675f] p-6 rounded-[2rem] text-white">
              <h3 className="font-bold text-xl mb-4">Need a Quote?</h3>
              <p className="text-[#73ebdc] text-sm mb-8">Every smile is unique. Get a personalized estimate after your first consultation.</p>
              <button className="w-full py-3 bg-white text-[#00675f] rounded-xl font-bold hover:bg-[#73ebdc] transition-colors">Book Consult</button>
            </div>
          </div>
        </div>
      </section>

      {/* SUITABILITY CARDS - from DB candidates/alternatives */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-white/40 border border-[#2eb2a5]/20 p-6 rounded-[2rem] shadow-xl shadow-[#2eb2a5]/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2eb2a5]/10 flex items-center justify-center text-[#2eb2a5]">
                <CheckCircle className="text-xl" />
              </div>
              <h3 className="text-lg font-bold text-[#2f2f2e]">Recommended For</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {candidateItems && candidateItems.length > 0 ? candidateItems.slice(0, 3).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[#5c5b5b]">
                  <CheckCircle className="text-[#2eb2a5] text-base mt-0.5 flex-shrink-0" />{item}
                </li>
              )) : (
                <>
                  <li className="flex items-start gap-2 text-[#5c5b5b]"><CheckCircle className="text-[#2eb2a5] text-base mt-0.5 flex-shrink-0" />Urban professionals seeking efficient solutions.</li>
                  <li className="flex items-start gap-2 text-[#5c5b5b]"><CheckCircle className="text-[#2eb2a5] text-base mt-0.5 flex-shrink-0" />Families looking for world-class specialists.</li>
                  <li className="flex items-start gap-2 text-[#5c5b5b]"><CheckCircle className="text-[#2eb2a5] text-base mt-0.5 flex-shrink-0" />Individuals prioritizing modern aesthetics.</li>
                </>
              )}
            </ul>
          </div>
          <div className="flex-1 bg-[#f3f0ef]/50 border border-[#aeadac]/10 p-6 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center text-red-500/60">
                <XCircle className="text-xl" />
              </div>
              <h3 className="text-lg font-bold text-[#2f2f2e]">May Not Be Suitable</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {alternativeItems && alternativeItems.length > 0 ? alternativeItems.slice(0, 3).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[#5c5b5b]">
                  <XCircle className="text-red-500/40 text-base mt-0.5 flex-shrink-0" />{item}
                </li>
              )) : (
                <>
                  <li className="flex items-start gap-2 text-[#5c5b5b]"><XCircle className="text-red-500/40 text-base mt-0.5 flex-shrink-0" />Those seeking traditional low-cost clinics.</li>
                  <li className="flex items-start gap-2 text-[#5c5b5b]"><XCircle className="text-red-500/40 text-base mt-0.5 flex-shrink-0" />Patients preferring paper processes.</li>
                  <li className="flex items-start gap-2 text-[#5c5b5b]"><XCircle className="text-red-500/40 text-base mt-0.5 flex-shrink-0" />Emergency walk-in cases.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQS - from DB faqs */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight">Common Inquiries</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
            {faqs.slice(0, 10).map((faq: any, i: number) => (
              <div key={i} className="group p-6 rounded-2xl border border-[#aeadac]/10 hover:bg-[#eae8e7] transition-colors cursor-pointer" onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[#2f2f2e]">{faq.q || faq.question}</h4>
                  <ChevronDown className={`text-[#00675f] group-hover:rotate-180 transition-transform ${openFaqIndex === i ? 'rotate-180' : ''}`} />
                </div>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="text-[#5c5b5b] text-sm mt-4 pt-4 border-t border-[#aeadac]/10">{faq.a || faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPLORE OTHER LOCATIONS - from DB cities table */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto pt-24 border-t border-[#aeadac]/10">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-[#2f2f2e]">Explore Other Locations</h2>
              <p className="text-[#5c5b5b] font-medium">Find our verified network of specialists across {stateName}.</p>
            </div>
            <button className="text-[#2eb2a5] font-bold flex items-center gap-2 hover:translate-x-2 transition-transform">
              Global Directory <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {cities.map((c: any, i: number) => (
              <Link key={i} href={`/${normalizedStateSlug}/${c.slug}/`} className="group">
                <div className="text-[#5c5b5b] font-medium group-hover:text-[#2eb2a5] transition-colors">{c.name}</div>
                <div className="text-[10px] text-[#787676] uppercase tracking-widest font-bold mt-1">{i === 0 ? 'Primary Hub' : `Area ${i + 1}`}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  // Mobile Layout - matches mobile design file exactly
  const MobileLayout = () => (
    <div className="lg:hidden">
      {/* 1. Search Hub Hero */}
      <section className="relative min-h-[500px] flex flex-col justify-end p-6 bg-[#0e0e0e] overflow-hidden">
        <div className="absolute inset-0">
          <img className="w-full h-full object-cover opacity-40" alt="clinic" src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&h=600&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/60 to-transparent" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <span className="text-[#73ebdc] font-bold tracking-widest text-[10px] uppercase">{locationName} Hub</span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-[1.1]">{displayH1}</h2>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold px-1">Specialization</label>
              <div className="bg-white/10 rounded-lg p-3 flex items-center justify-between text-white border border-white/5">
                <span className="text-sm">{treatmentName}</span>
                <ChevronDown className="text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold px-1">Neighborhood</label>
              <div className="bg-white/10 rounded-lg p-3 flex items-center justify-between text-white border border-white/5">
                <span className="text-sm">{locationName}</span>
                <MapPin className="text-sm" />
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-[#00675f] to-[#73ebdc] text-white py-4 rounded-full font-bold text-sm shadow-lg shadow-[#00675f]/20">
              Discover Practices
            </button>
          </div>
        </div>
      </section>

      {/* 2. Market Transparency */}
      <section className="p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Market Transparency</h3>
          <p className="text-sm text-[#5c5b5b] leading-relaxed">Typical treatment costs in {locationName} region.</p>
        </div>
        <div className="space-y-4">
          <div className="bg-[#f3f0ef] p-5 rounded-xl border-l-4 border-[#00675f]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#00675f]">Standard</span>
              <span className="text-lg font-bold">AED {priceMin || 450}</span>
            </div>
            <p className="text-xs text-[#5c5b5b]">Essential care at certified community clinics.</p>
          </div>
          <div className="bg-[#f3f0ef] p-5 rounded-xl border-l-4 border-[#00675f]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#00675f]">Average</span>
              <span className="text-lg font-bold">AED {priceMax || 1200}</span>
            </div>
            <p className="text-xs text-[#5c5b5b]">Specialist-led care with advanced diagnostics.</p>
          </div>
          <div className="bg-[#f3f0ef] p-5 rounded-xl border-l-4 border-[#2f2f2e]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#2f2f2e]">Premium</span>
              <span className="text-lg font-bold">AED {(priceMax || 1200) * 2}+</span>
            </div>
            <p className="text-xs text-[#5c5b5b]">Bespoke cosmetic artistry &amp; concierge service.</p>
          </div>
          <div className="bg-[#00675f] text-white p-6 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold">Need a Quote?</h4>
              <p className="text-xs opacity-80">Personalized estimate in 2 hours.</p>
            </div>
            <ChevronRight className="text-3xl" />
          </div>
        </div>
      </section>

      {/* 3. World-Class Specialists */}
      {hasProfiles && (
      <section className="p-6 bg-[#f3f0ef]/50">
        <div className="flex justify-between items-end mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight">World-Class Specialists</h3>
            <p className="text-sm text-[#5c5b5b]">Top-rated in {locationName}.</p>
          </div>
        </div>
        <div className="space-y-6">
          {topDoctors.slice(0, 4).map((doctor: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="h-48 relative">
                <img className="w-full h-full object-cover" alt={doctor.name} src={doctor.image} />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 flex items-center gap-1">
                  <Star className="text-yellow-500 text-xs fill-current" />
                  <span className="text-xs font-bold">{doctor.rating}</span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h4 className="font-bold text-lg">{doctor.name}</h4>
                  <p className="text-xs text-[#00675f] font-medium">{doctor.specialty}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-[#f3f0ef] px-2 py-1 rounded-full text-[#5c5b5b] font-bold">{doctor.experience}Y EXP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* 4. Concierge Journey */}
      <section className="p-6">
        <h3 className="text-2xl font-bold tracking-tight mb-8">Concierge Journey</h3>
        <div className="space-y-12 relative">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-[#00675f]/20" />
          {processSteps && processSteps.length > 0 ? processSteps.slice(0, 4).map((step: any, i: number) => (
            <div key={i} className="relative flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-[#00675f] flex items-center justify-center text-white z-10 shrink-0">
                {i === 0 && <Search className="text-xl" />}
                {i === 1 && <Calendar className="text-xl" />}
                {i === 2 && <BadgeCheck className="text-xl" />}
                {i === 3 && <Verified className="text-xl" />}
              </div>
              <div className="space-y-1 pt-2">
                <h4 className="font-bold">{step.title || `Step ${i + 1}`}</h4>
                <p className="text-xs text-[#5c5b5b] leading-relaxed">{step.description || step.desc}</p>
              </div>
            </div>
          )) : [
            { title: "Find", desc: "Search via specialized AI filters to find your ideal match." },
            { title: "Choose", desc: "Select a time slot that integrates with your calendar." },
            { title: "Register", desc: "Digital onboarding through our encrypted medical vault." },
            { title: "Confirmed", desc: "Receive your digital concierge pass and appointment brief." }
          ].map((step: any, i: number) => (
            <div key={i} className="relative flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-[#00675f] flex items-center justify-center text-white z-10 shrink-0">
                {i === 0 && <Search className="text-xl" />}
                {i === 1 && <Calendar className="text-xl" />}
                {i === 2 && <BadgeCheck className="text-xl" />}
                {i === 3 && <Verified className="text-xl" />}
              </div>
              <div className="space-y-1 pt-2">
                <h4 className="font-bold">{step.title}</h4>
                <p className="text-xs text-[#5c5b5b] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Precision in Location */}
      <section className="p-6 bg-[#0e0e0e] text-white">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#00675f]/20 p-2 rounded-lg">
              <Shield className="text-[#73ebdc] text-2xl" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#73ebdc]">Medical Verification</span>
          </div>
          <h3 className="text-3xl font-bold tracking-tight">Precision in {locationName}</h3>
          {pageContent ? (
            <div className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
              {pageContent.split('\n').slice(1).join('\n')}
            </div>
          ) : (
            <>
              <p className="text-white/70 text-sm leading-relaxed">
                Our {locationName} hub represents the pinnacle of dental curation in {stateName}. Each featured practice undergoes a rigorous 48-point diagnostic audit.
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                We ensure that your selection is backed by architectural precision and uncompromising medical standards.
              </p>
            </>
          )}
          <div className="pt-4 flex gap-4">
            <div className="border-l-2 border-[#73ebdc] pl-4">
              <div className="text-xl font-bold">100%</div>
              <div className="text-[10px] uppercase text-white/50 font-bold">Vetted Units</div>
            </div>
            <div className="border-l-2 border-[#73ebdc] pl-4">
              <div className="text-xl font-bold">{profiles?.length || 0}+</div>
              <div className="text-[10px] uppercase text-white/50 font-bold">Patient Success</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Recommended & Not Suitable */}
      <section className="p-6 space-y-4">
        <div className="bg-[#73ebdc]/30 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-[#00675f]">
            <CheckCircle className="font-bold" />
            <span className="font-bold text-sm">Recommended For</span>
          </div>
          <ul className="space-y-3 text-xs text-[#5c5b5b]">
            {candidateItems.slice(0, 2).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00675f] mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-500/10 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="font-bold" />
            <span className="font-bold text-sm">May Not Be Suitable</span>
          </div>
          <ul className="space-y-3 text-xs text-[#5c5b5b]">
            {alternativeItems.slice(0, 2).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. Common Inquiries (FAQs) */}
      <section className="p-6 space-y-8">
        <h3 className="text-2xl font-bold tracking-tight">Common Inquiries</h3>
        <div className="space-y-4">
          {faqs.slice(0, 10).map((faq: any, i: number) => (
            <div key={i} className="border-b border-[#aeadac]/20 pb-4">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm font-semibold leading-tight">{faq.q || faq.question}</span>
                <ChevronDown className="text-[#00675f]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Explore Other Hubs */}
      <section className="p-6 bg-[#f3f0ef]">
        <h3 className="text-lg font-bold tracking-tight mb-6">Explore Other Hubs</h3>
        <div className="grid grid-cols-2 gap-3">
          {(allCitiesInEmirate || cities).slice(0, 6).map((c: any, i: number) => (
            <Link key={i} href={`/${normalizedStateSlug}/${c.slug}/`} className="bg-white p-4 rounded-xl">
              <span className="text-xs font-bold text-[#00675f] block mb-1">{c.name}</span>
              {c.practice_count && <span className="text-[10px] text-[#5c5b5b] uppercase tracking-widest">{c.practice_count} Practices</span>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <PageLayout>
      <SEOHead
        title={seoDataProp?.title || seoDataFromProps?.meta_title || `${treatmentName} in ${locationName}`}
        description={seoDataProp?.description || seoDataFromProps?.meta_description || `Find the best ${treatmentName} specialists in ${locationName}.`}
        canonical={seoDataProp?.canonical || `/${normalizedStateSlug}/${citySlug}/${service}/`}
        keywords={[`${treatmentName} ${locationName}`, `${treatmentName} specialist`]}
      />
      
      <SyncStructuredData data={[{ type: 'breadcrumb', items: [{ name: 'Home', url: '/' }, ...(normalizedStateSlug && stateName ? [{ name: stateName, url: `/${normalizedStateSlug}/` }] : []), { name: treatmentName }] }]} id="service-location-schema" />
      
      <DesktopLayout />
      <MobileLayout />
    </PageLayout>
  );
};

export default ServiceLocationPage;