'use client';
import { ArrowRight, ChevronRight, ChevronDown, Calendar, Search, Globe, Zap, Plane, Waves, Palmtree, Landmark, Store, Clock } from "lucide-react";
import { FaTooth, FaStar, FaBuilding, FaStethoscope, FaAward, FaCheckCircle, FaShieldAlt, FaMapMarkerAlt, FaUserNurse, FaCalendarCheck, FaSearch, FaUserMd, FaHospital, FaMedal, FaCrown, FaCertificate, FaRegStar, FaUserFriends, FaTooth as ToothIcon, FaRibbon } from "react-icons/fa";
import { RiShieldCheckFill, RiHospitalFill, RiStarSmileFill, RiCustomerService2Fill, Ri24HoursFill, RiArrowRightSLine } from "react-icons/ri";
import { BsFillEmojiSmileFill, BsFillPatchCheckFill, BsCalendarCheck } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import dynamic from 'next/dynamic';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBox } from "@/components/SearchBox";
import { AutoScrollCarousel } from "@/components/AutoScrollCarousel";
import { TypewriterText } from "@/components/TypewriterText";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTopDentistsPerLocation } from "@/hooks/useProfiles";
import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { SyncStructuredData } from "@/components/seo/SyncStructuredData";
import { useStatesWithClinics } from "@/hooks/useLocations";
import { ACTIVE_STATES } from "@/lib/constants/activeStates";
import { useRealCounts } from "@/hooks/useRealCounts";
import { useSeoPageContent } from "@/hooks/useSeoPageContent";

const AIExplainerSection = dynamic(
  () => import('@/components/ai/AIExplainerSection').then(m => ({ default: m.AIExplainerSection })),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded-xl h-64" /> }
);
const ForDentistsAISection = dynamic(
  () => import('@/components/ai/ForDentistsAISection').then(m => ({ default: m.ForDentistsAISection })),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded-xl h-48" /> }
);

const heroTexts = [
  "Teeth Whitening",
  "Dental Implants",
  "Invisalign",
  "Veneers",
  "Smile Makeover",
  "Root Canal",
];

const benefits = [
  {
    icon: RiShieldCheckFill,
    title: "DHA & DOH Verified",
    description: "Every dentist is licensed by Dubai Health Authority or Department of Health Abu Dhabi.",
  },
  {
    icon: Ri24HoursFill,
    title: "Book in 60 Seconds",
    description: "Streamlined booking connects you with specialists across all 7 Emirates instantly.",
  },
  {
    icon: FaStar,
    title: "Real Patient Reviews",
    description: "Authentic reviews from real patients across Dubai, Abu Dhabi, and Sharjah.",
  },
  {
    icon: FaUserFriends,
    title: "Expat-Friendly Care",
    description: "Multilingual dentists who speak English, Arabic, Hindi, Tagalog, and more.",
  },
];

const emirateAreas = [
  {
    emirate: "Dubai",
    icon: FaBuilding,
    slug: "dubai",
    areas: [
      { name: "Marina", slug: "dubai/marina" },
      { name: "Jumeirah", slug: "dubai/jumeirah" },
      { name: "Downtown", slug: "dubai/downtown" },
      { name: "Business Bay", slug: "dubai/business-bay" },
    ]
  },
  {
    emirate: "Abu Dhabi",
    icon: Landmark,
    slug: "abu-dhabi",
    areas: [
      { name: "Corniche", slug: "abu-dhabi/corniche" },
      { name: "Yas Island", slug: "abu-dhabi/yas-island" },
      { name: "Al Reem", slug: "abu-dhabi/reem-island" },
      { name: "Khalidiyah", slug: "abu-dhabi/khalidiyah" },
    ]
  },
  {
    emirate: "Sharjah",
    icon: FaBuilding,
    slug: "sharjah",
    areas: [
      { name: "Al Majaz", slug: "sharjah/al-majaz" },
      { name: "Al Nahda", slug: "sharjah/al-nahda" },
      { name: "Al Qasimia", slug: "sharjah/al-qasimia" },
    ]
  },
  {
    emirate: "Ajman",
    icon: FaBuilding,
    slug: "ajman",
    areas: [
      { name: "Downtown", slug: "ajman/downtown" },
      { name: "Al Nuaimiya", slug: "ajman/al-nuaimiya" },
    ]
  },
  {
    emirate: "Ras Al Khaimah",
    icon: Palmtree,
    slug: "ras-al-khaimah",
    areas: [
      { name: "RAK City", slug: "ras-al-khaimah/rak-city" },
      { name: "Al Nakheel", slug: "ras-al-khaimah/al-nakheel" },
    ]
  },
  {
    emirate: "Fujairah",
    icon: Waves,
    slug: "fujairah",
    areas: [
      { name: "Fujairah City", slug: "fujairah/fujairah-city" },
    ]
  },
  {
    emirate: "Umm Al Quwain",
    icon: Plane,
    slug: "umm-al-quwain",
    areas: [
      { name: "City Center", slug: "umm-al-quwain/city-center" },
    ]
  },
];

const uaeFaqs = [
  {
    q: "How do I find a DHA-licensed dentist in Dubai?",
    a: "Use our search to filter by emirate or area. All dentists on AppointPanda are licensed by DHA (Dubai), DOH (Abu Dhabi), or MOHAP. Look for the 'Verified' badge for extra assurance."
  },
  {
    q: "What is the average cost of dental treatment in Dubai (AED)?",
    a: "Costs vary by treatment: teeth whitening starts from AED 500, dental implants from AED 3,000, Invisalign from AED 8,000, and veneers from AED 800 per tooth. Prices differ by clinic and area."
  },
  {
    q: "Do dentists in UAE accept insurance?",
    a: "Yes, most clinics accept major UAE insurance providers including Daman Health, AXA Gulf, Oman Insurance (Sukoon), Cigna, MetLife, ADNIC, and Noor Takaful. Filter by your insurance on our search."
  },
  {
    q: "Are there English-speaking dentists in Dubai?",
    a: "Absolutely. The UAE has a diverse medical workforce. Most dentists speak English fluently, and many also speak Arabic, Hindi, Urdu, Tagalog, and other languages common in the UAE."
  },
  {
    q: "Can I book same-day emergency dental appointments in Dubai?",
    a: "Yes, many clinics on AppointPanda offer same-day emergency appointments. Use our search and filter by 'Emergency Dental Care' to find available clinics near you."
  },
];

const defaultEmirateImages: Record<string, string> = {
  "dubai": "/assets/dubai-BMHiWEKF.jpg",
  "abu-dhabi": "/assets/abu-dhabi-DlB1ZtlL.jpg",
  "sharjah": "/assets/sharjah-dG2ZD8ZB.jpg",
  "ajman": "/assets/ajman-CX4URw3V.jpg",
  "ras-al-khaimah": "/assets/ras-al-khaimah-Cxa1wpyV.jpg",
  "fujairah": "/assets/fujairah-ffT7cCkx.jpg",
  "umm-al-quwain": "/assets/umm-al-quwain-DLTMgQDO.jpg",
};

function EmirateCard({ state, index }: { state: any; index: number }) {
  const imageUrl = defaultEmirateImages[state.slug];
  const isFirst = index < ACTIVE_STATES.length;
  const headingFont = "'Nunito', 'Plus Jakarta Sans', system-ui, sans-serif";

  return (
    <Link
      key={`${state.slug}-${index}`}
      href={`/${state.slug}/`}
      className="group flex flex-col items-center gap-2 text-center shrink-0"
    >
      <div className="h-16 w-16 md:h-24 md:w-24 rounded-full border-2 md:border-3 border-primary/30 overflow-hidden group-hover:scale-110 group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300 relative bg-gradient-to-br from-primary/20 via-primary/10 to-teal/10 flex items-center justify-center">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={`${state.name} landmark`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </>
        ) : (
          <span className="text-xs md:text-sm font-black text-primary" style={{ fontFamily: headingFont }}>
            {state.name.substring(0, 2)}
          </span>
        )}
      </div>
      <span className="font-bold text-xs md:text-sm text-foreground group-hover:text-primary transition-colors whitespace-nowrap" style={{ fontFamily: headingFont }}>
        {state.name}
      </span>
    </Link>
  );
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface IndexPageProps {
  dehydratedStateProp?: any;
  seoDataProp?: {
    title: string;
    description: string;
  };
  realCountsProp?: { clinics: number; states: number; cities: number; dentists: number; treatments: number };
  topProfilesProp?: Profile[];
  statesWithClinicsProp?: State[];
}

interface State { id: string; name: string; slug: string; abbreviation: string }

interface Profile {
  id: string;
  name: string;
  slug: string;
  type: 'dentist' | 'clinic';
  specialty?: string;
  location?: string;
  rating: number;
  reviewCount: number;
  image?: string;
  isVerified: boolean;
  clinicName?: string;
  clinicId?: string;
  areaId?: string;
  cityId?: string;
}

const Index = ({ seoDataProp, realCountsProp, topProfilesProp, statesWithClinicsProp }: IndexPageProps = {}) => {
  const router = useRouter();
  const legacyPostId = typeof router.query?.p === 'string' ? router.query.p : null;

  // Only render SEOHead on client-side when there's no server-provided seoDataProp
  // Server-side SEO is handled by the wrapper component in getStaticProps
  const shouldRenderSeoHead = !seoDataProp;

  // Use server-prefetched data as initialData — instant render, no refetch
  const { data: profiles } = useTopDentistsPerLocation(30, topProfilesProp);
  const { data: statesWithClinics } = useStatesWithClinics(statesWithClinicsProp);
  const { data: realCounts } = useRealCounts(realCountsProp);
  const states = ACTIVE_STATES.map(as => {
    const dbState = statesWithClinics?.find((s: any) => s.slug === as.slug);
    return {
      id: dbState?.id || as.slug,
      name: as.name,
      slug: as.slug,
      abbreviation: as.abbr,
    };
  });
  const { data: seoContent } = useSeoPageContent("/");

  const { data: treatments } = useQuery({
    queryKey: ['homepage-treatments'],
    queryFn: async () => {
      const { data } = await supabaseAdmin
        .from('treatments')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order')
        .limit(12);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  if (legacyPostId) {
    if (typeof window !== 'undefined') router.replace('/blog');
    return null;
  }

  const stats = [
    { value: realCounts?.clinics?.toLocaleString() || "0", label: "Clinics", icon: FaBuilding },
    { value: realCounts?.cities?.toLocaleString() || "0", label: "Areas", icon: FaMapMarkerAlt },
    { value: "4.9★", label: "Rating", icon: FaStar },
    { value: "60s", label: "To Book", icon: Ri24HoursFill },
  ];

  const carouselProfiles = profiles?.map(p => ({
    name: p.name,
    specialty: p.specialty || 'Dental Professional',
    location: p.location || 'UAE',
    rating: p.rating,
    image: p.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    slug: p.slug,
    type: p.type,
  })) || [];

  const headingFont = "'Nunito', 'Plus Jakarta Sans', system-ui, sans-serif";

  return (
    <div className="min-h-screen bg-background">
      {shouldRenderSeoHead && (
        <SEOHead
          title={seoDataProp?.title || seoContent?.meta_title || "Find the Best Dentists in Dubai & UAE | AppointPanda"}
          description={seoDataProp?.description || seoContent?.meta_description || "Search verified DHA & DOH licensed dentists across Dubai, Abu Dhabi, Sharjah & all 7 Emirates. Compare reviews, check AED pricing & book appointments online."}
          canonical="/"
          keywords={['dentist in dubai', 'dental clinics UAE', 'DHA licensed dentist', 'dentist abu dhabi', 'best dentist sharjah', 'dental implants dubai', 'teeth whitening UAE']}
        />
      )}
      <StructuredData type="organization" />
      <SyncStructuredData data={{ type: 'webSite', name: 'AppointPanda', url: 'https://www.AppointPanda.ae', searchUrl: 'https://www.AppointPanda.ae/search' }} />
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO / BANNER
          ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[90svh] flex items-start bg-slate-950 pt-4 md:pt-6 lg:pt-8">
        {/* Centered spotlight glow - slightly left */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Main spotlight from above-left of center */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-[30%] -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-primary/30 via-primary/15 to-transparent rounded-b-[100%] blur-[180px]"
          />
          {/* Soft center fill */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/4 left-[30%] -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[150px]"
          />
          {/* Subtle bottom accent */}
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-0 left-[30%] -translate-x-1/2 w-[1000px] h-[300px] bg-slate-900 rounded-t-[100%] blur-[100px]"
          />
        </div>

        <div className="relative z-10 w-full py-8 md:py-12 lg:py-16 px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-end max-w-[1600px] mx-auto">
            {/* Left: Headlines + Search */}
            <div className="text-center lg:text-left">
              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-wrap gap-2.5 mb-8 md:mb-10 justify-center lg:justify-start"
              >
                <span className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-md border border-primary/30 rounded-full px-4 py-2 shadow-lg">
                  <RiShieldCheckFill className="h-5 w-5 text-primary" />
                  <span className="text-xs md:text-sm font-bold text-primary">DHA & DOH Verified</span>
                </span>
                <span className="inline-flex items-center gap-2 bg-gold/15 backdrop-blur-md border border-gold/30 rounded-full px-4 py-2 shadow-lg">
                  <RiStarSmileFill className="h-4 w-4 text-gold" />
                  <span className="text-xs md:text-sm font-bold text-gold">4.9★ Rated Platform</span>
                </span>
                <span className="inline-flex items-center gap-2 bg-emerald/15 backdrop-blur-md border border-emerald/30 rounded-full px-4 py-2 shadow-lg">
                  <BsFillEmojiSmileFill className="h-4 w-4 text-emerald" />
                  <span className="text-xs md:text-sm font-bold text-emerald">Expat-Friendly</span>
                </span>
              </motion.div>

              {/* Main headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="leading-[1.05] mb-5"
                style={{ fontFamily: headingFont }}
              >
                <span className="block text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[5.5rem] font-black text-white tracking-tight">
                  Find Your
                </span>
                <span className="block text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[5.5rem] font-black text-primary tracking-tight mt-1">
                  Perfect Dentist
                </span>
                <span className="block text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[5.5rem] font-black text-white/80 tracking-tight mt-1">
                  in UAE
                </span>
              </motion.h1>

              {/* Typewriter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <span className="text-lg md:text-xl font-semibold text-white/50">
                  Specializing in{" "}
                  <TypewriterText texts={heroTexts} className="text-primary font-bold" />
                </span>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base md:text-lg text-white/40 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
              >
                Search across Dubai, Abu Dhabi, Sharjah & all 7 Emirates. Compare AED pricing, read real reviews & book instantly.
              </motion.p>

              {/* Search box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="max-w-2xl mx-auto lg:mx-0"
              >
                <SearchBox variant="hero" />
              </motion.div>
            </div>

            {/* Right: Stats with descriptions - Big cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6"
            >
              {[
                { icon: FaBuilding, value: `${realCounts?.clinics?.toLocaleString() || "0"}+`, label: "Clinics", desc: "Verified clinics" },
                { icon: FaStar, value: "4.9★", label: "Rating", desc: "Patient rating" },
                { icon: FaStethoscope, value: `${realCounts?.dentists?.toLocaleString() || "0"}+`, label: "Specialists", desc: "Experts" },
                { icon: FaUserFriends, value: realCounts?.states ? `${realCounts.states}+` : "7+", label: "Emirates", desc: "Across UAE" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl lg:rounded-3xl p-4 lg:p-8 text-center hover:bg-white/[0.1] hover:border-primary/30 transition-all duration-300 flex flex-col items-center justify-center"
                >
                  <stat.icon className="h-6 w-6 lg:h-8 lg:w-8 text-primary mb-2 lg:mb-3" />
                  <div className="text-2xl lg:text-3xl font-black text-white" style={{ fontFamily: headingFont }}>{stat.value}</div>
                  <div className="text-xs lg:text-sm font-bold text-white/80 uppercase tracking-widest mt-1">{stat.label}</div>
                  <div className="text-[10px] lg:text-xs text-white/50 mt-1">{stat.desc}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Straight flat bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-background" />
      </section>

      {/* ══════════════════════════════════════════
          EMIRATES SCROLL LOOP - Right after banner
          ══════════════════════════════════════════ */}
      <section className="py-6 md:py-10 bg-background">
        {/* Mobile: static horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 md:hidden scrollbar-hide">
          {states.map((state) => (
            <EmirateCard key={state.slug} state={state} index={0} />
          ))}
        </div>
        {/* Desktop: infinite scroll animation */}
        <div className="hidden md:block scroll-wrapper w-full overflow-hidden">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="scroll-container flex gap-6 md:gap-8 py-3 animate-scroll"
          >
            {[...states, ...states, ...states, ...states].map((state, index) => (
              <EmirateCard key={`${state.slug}-${index}`} state={state} index={index} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BROWSE BY EMIRATE (with Popular Areas)
          ══════════════════════════════════════════ */}
      <section className="py-12 md:py-16 lg:py-20 bg-background">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-10"
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <FaMapMarkerAlt className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Browse by Emirate</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground" style={{ fontFamily: headingFont }}>
              Find Dentists in Your{" "}
              <span className="text-primary">Emirate</span>
            </h2>
            <p className="text-muted-foreground mt-2 md:mt-3 max-w-lg mx-auto text-sm md:text-base">
              Select your emirate to discover DHA & DOH licensed dental professionals near you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {emirateAreas.map((emirate, index) => {
              const IconComponent = emirate.icon;
              const [isOpen, setIsOpen] = useState(false);
              return (
                <motion.div
                  key={emirate.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div
                    className="bg-white/[0.04] backdrop-blur-sm rounded-3xl p-5 border border-white/10 hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300 h-full flex flex-col"
                  >
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold text-foreground">{emirate.emirate}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-white/10">
                            <p className="text-xs text-muted-foreground mb-3">Popular Areas</p>
                            <div className="flex flex-wrap gap-2">
                              {emirate.areas.map((area) => (
                                <Link
                                  key={area.slug}
                                  href={`/${area.slug}/`}
                                  className="px-3 py-1.5 rounded-full bg-muted/60 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/20 hover:text-primary transition-all duration-200"
                                >
                                  {area.name}
                                </Link>
                              ))}
                            </div>
                            <Link
                              href={`/${emirate.slug}/`}
                              className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary hover:gap-2 transition-all"
                            >
                              View All <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY CHOOSE US — 4-card dark section
          ══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 lg:py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-[10%] w-48 h-48 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 left-[5%] w-40 h-40 bg-teal/10 rounded-full blur-[80px]" />
        </div>
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-10"
          >
            <span className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2 mb-4 border border-primary/30">
              <FaUserNurse className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Why AppointPanda</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white" style={{ fontFamily: headingFont }}>
              The UAE's Trusted{" "}
              <span className="text-primary">Dental Directory</span>
            </h2>
            <p className="text-white/50 mt-2 md:mt-3 max-w-xl mx-auto text-sm md:text-base">
              Thousands of patients across all 7 Emirates trust us to find the right dentist.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          >
            {benefits.map((benefit, i) => (
              <motion.div key={i} variants={staggerItem}>
                <div className="group bg-white/[0.04] backdrop-blur-sm rounded-3xl p-6 md:p-7 text-center border border-white/10 hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-400 h-full">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 mb-5 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black mb-2 text-white group-hover:text-primary transition-colors" style={{ fontFamily: headingFont }}>
                    {benefit.title}
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Explainer Section */}
      <AIExplainerSection />

      {/* ══════════════════════════════════════════
          FEATURED DENTISTS CAROUSEL
          ══════════════════════════════════════════ */}
      {carouselProfiles.length > 0 && (
        <section className="py-16 md:py-20 lg:py-24 bg-muted/30 relative overflow-hidden">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 md:mb-10 text-center"
            >
              <span className="inline-flex items-center gap-2 bg-gold/10 rounded-full px-4 py-2 mb-4">
                <RiStarSmileFill className="h-4 w-4 text-gold" />
                <span className="text-sm font-bold text-gold">Elite Selection</span>
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground" style={{ fontFamily: headingFont }}>
                Top Rated <span className="text-primary">Dentists</span>
              </h2>
              <p className="text-muted-foreground mt-2 md:mt-3 max-w-lg mx-auto text-sm md:text-base">
                Browse our highest-rated dental professionals across all 7 Emirates.
              </p>
            </motion.div>
            <AutoScrollCarousel doctors={carouselProfiles} autoScrollSpeed={25} />
            <div className="mt-8 text-center">
              <Button asChild size="lg" className="rounded-2xl font-black px-10 h-14 text-base shadow-lg shadow-primary/20" style={{ fontFamily: headingFont }}>
                <Link href="/search/">
                  View Full Directory <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          DENTAL SERVICES CATALOG
          ══════════════════════════════════════════ */}
      <section className="py-12 md:py-16 lg:py-20 bg-background relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-border bg-card/60 backdrop-blur-sm p-5 md:p-8 lg:p-12">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
              <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
              <div>
                <span className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5 md:px-4 md:py-2 mb-3 md:mb-4 border border-primary/20">
                  <RiHospitalFill className="h-4 w-4 text-primary" />
                  <span className="text-xs md:text-sm font-bold text-primary">Comprehensive Care</span>
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground" style={{ fontFamily: headingFont }}>
                  Dental <span className="text-primary">Services</span>
                </h2>
                <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base max-w-lg">
                  Find specialists for every dental need across the UAE. AED pricing on all profiles.
                </p>
              </div>
              <Link href="/services/" className="group inline-flex items-center gap-2 text-primary hover:text-primary/80 font-bold transition-all text-sm">
                View All Services <ArrowRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
              {treatments?.map((treatment) => (
                <Link
                  key={treatment.id}
                  href={`/services/${treatment.slug}/`}
                  className="group relative bg-background/60 border border-border rounded-xl md:rounded-2xl p-3 md:p-4 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs md:text-sm text-foreground group-hover:text-primary transition-colors">{treatment.name}</span>
                    <div className="shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                      <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-primary group-hover:text-primary-foreground transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Dentists Section */}
      <ForDentistsAISection />

      {/* ══════════════════════════════════════════
          HOW IT WORKS — 3 Steps (Modern Light Cards)
          ══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 lg:py-24 bg-background relative overflow-hidden">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-10"
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <FaCertificate className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Simple 3-Step Process</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-2" style={{ fontFamily: headingFont }}>
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
              Finding your perfect dentist in the UAE has never been easier.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
          >
            {[
              { step: 1, icon: FaSearch, title: "Search Your Area", desc: "Enter your emirate, area, or neighborhood and tell us what dental care you need." },
              { step: 2, icon: FaCheckCircle, title: "Compare & Choose", desc: "Browse verified profiles, check AED pricing, and read real patient reviews." },
              { step: 3, icon: BsCalendarCheck, title: "Book in Seconds", desc: "Schedule your appointment instantly online. Get confirmation automatically." },
            ].map((item) => (
              <motion.div key={item.step} variants={staggerItem}>
                <div className="group bg-card rounded-3xl p-6 md:p-7 text-center border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-400 h-full">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl font-black mb-2 text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: headingFont }}>
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-10">
            <Button asChild size="lg" className="rounded-2xl font-black px-10 h-14 text-base shadow-lg shadow-primary/20" style={{ fontFamily: headingFont }}>
              <Link href="/search">
                Start Your Search <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ SECTION (Modern Column Cards)
          ══════════════════════════════════════════ */}
<section className="py-16 md:py-20 lg:py-24 bg-muted/20 relative">
          <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-10"
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <RiStarSmileFill className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">How It Works</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black" style={{ fontFamily: headingFont }}>
              Book Your Dentist in
              <span className="block text-primary mt-2">3 Easy Steps</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-5xl mx-auto">
            {uaeFaqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors" style={{ fontFamily: headingFont }}>
                  {faq.q}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="rounded-2xl font-black" style={{ fontFamily: headingFont }}>
              <Link href="/faq/">View All FAQs <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA - Your Smile Matters
          ══════════════════════════════════════════ */}
      <section className="py-20 md:py-24 lg:py-28 relative overflow-hidden bg-slate-950">
        {/* Side glows - different from banner's top spotlight */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Left side glow - main accent */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/30 via-primary/15 to-transparent rounded-r-[100%] blur-[150px]"
          />
          {/* Right side glow - secondary */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute right-0 bottom-1/4 w-[700px] h-[700px] bg-gradient-to-l from-teal/25 via-teal/12 to-transparent rounded-l-[100%] blur-[120px]"
          />
          {/* Subtle center fill */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-slate-900/80 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 w-full">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {/* Your Smile Matters badge - floating heart */}
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-md rounded-full px-4 py-2 mb-6 border border-primary/20"
              >
                <BsFillEmojiSmileFill className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary">Your Smile Matters</span>
              </motion.span>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.05]" style={{ fontFamily: headingFont }}>
                Ready to Find Your Perfect Dentist?
              </h2>

              <p className="text-sm md:text-lg text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
                Join thousands of patients across Dubai, Abu Dhabi & Sharjah who've discovered exceptional dental care through our platform.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="rounded-2xl font-black px-10 h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30" style={{ fontFamily: headingFont }}>
                  <Link href="/search/">
                    Find a Dentist <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl font-black px-10 h-14 text-lg border-2 border-white/20 text-white bg-white/5 hover:bg-white/10" style={{ fontFamily: headingFont }}>
                  <Link href="/list-your-practice/">
                    <FaUserMd className="mr-2 h-5 w-5" /> I'm a Dentist
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
