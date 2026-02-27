'use client';
import { ArrowRight, Shield, Clock, Star, MapPin, Heart, Search, Building2, Stethoscope, Calendar, CheckCheck, Sparkles, Globe, ChevronRight, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBox } from "@/components/SearchBox";
import { AIExplainerSection, ForDentistsAISection } from "@/components/ai";
import { AutoScrollCarousel } from "@/components/AutoScrollCarousel";
import { TypewriterText } from "@/components/TypewriterText";
import { Button } from "@/components/ui/button";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useTopDentistsPerLocation } from "@/hooks/useProfiles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { SyncStructuredData } from "@/components/seo/SyncStructuredData";
import { useStatesWithClinics } from "@/hooks/useLocations";
import { ACTIVE_STATES } from "@/lib/constants/activeStates";
import { useRealCounts } from "@/hooks/useRealCounts";
import { useSeoPageContent } from "@/hooks/useSeoPageContent";

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
    icon: Shield,
    title: "DHA & DOH Verified",
    description: "Every dentist is licensed by Dubai Health Authority or Department of Health Abu Dhabi.",
  },
  {
    icon: Clock,
    title: "Book in 60 Seconds",
    description: "Streamlined booking connects you with specialists across all 7 Emirates instantly.",
  },
  {
    icon: Star,
    title: "Real Patient Reviews",
    description: "Authentic reviews from real patients across Dubai, Abu Dhabi, and Sharjah.",
  },
  {
    icon: Globe,
    title: "Expat-Friendly Care",
    description: "Multilingual dentists who speak English, Arabic, Hindi, Tagalog, and more.",
  },
];

const popularAreas = [
  { name: "Jumeirah", emirate: "Dubai", slug: "dubai/jumeirah" },
  { name: "Marina", emirate: "Dubai", slug: "dubai/marina" },
  { name: "Downtown", emirate: "Dubai", slug: "dubai/downtown" },
  { name: "Deira", emirate: "Dubai", slug: "dubai/deira" },
  { name: "Al Barsha", emirate: "Dubai", slug: "dubai/al-barsha" },
  { name: "Business Bay", emirate: "Dubai", slug: "dubai/business-bay" },
  { name: "JLT", emirate: "Dubai", slug: "dubai/jlt" },
  { name: "Khalidiyah", emirate: "Abu Dhabi", slug: "abu-dhabi/khalidiyah" },
  { name: "Al Nahda", emirate: "Sharjah", slug: "sharjah/al-nahda" },
  { name: "Mirdif", emirate: "Dubai", slug: "dubai/mirdif" },
  { name: "DIFC", emirate: "Dubai", slug: "dubai/difc" },
  { name: "Karama", emirate: "Dubai", slug: "dubai/karama" },
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
  const headingFont = "'Varela Round', 'Quicksand', system-ui, sans-serif";

  return (
    <Link
      key={`${state.slug}-${index}`}
      to={`/${state.slug}`}
      className="group flex flex-col items-center gap-3 text-center shrink-0"
    >
      <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-3 border-primary/30 overflow-hidden group-hover:scale-110 group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300 relative bg-gradient-to-br from-primary/20 via-primary/10 to-teal/10 flex items-center justify-center">
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
          <span className="text-sm md:text-base font-black text-primary" style={{ fontFamily: headingFont }}>
            {state.name.substring(0, 2)}
          </span>
        )}
      </div>
      <span className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors whitespace-nowrap" style={{ fontFamily: headingFont }}>
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

const Index = () => {
  const location = useLocation();
  const legacyPostId = new URLSearchParams(location.search).get("p");

  // Debug: Test Supabase connection
  const { data: testData } = useQuery({
    queryKey: ['test-supabase'],
    queryFn: async () => {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('states').select('*').limit(1);
      console.log('Supabase test result:', data, error);
      return data;
    },
    enabled: true,
  });

  const { data: profiles } = useTopDentistsPerLocation(30);
  const { data: statesWithClinics } = useStatesWithClinics();
  // Use all 7 Emirates from ACTIVE_STATES, enriched with clinic data when available
  const states = ACTIVE_STATES.map(as => {
    const dbState = statesWithClinics?.find(s => s.slug === as.slug);
    return {
      id: dbState?.id || as.slug,
      name: as.name,
      slug: as.slug,
      abbreviation: as.abbr,
    };
  });
  const { data: realCounts } = useRealCounts();
  const { data: seoContent } = useSeoPageContent("/");

  const { data: treatments } = useQuery({
    queryKey: ['homepage-treatments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatments')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order')
        .limit(12);
      return data || [];
    },
  });

  if (legacyPostId) {
    return <Navigate to="/blog" replace />;
  }

  const stats = [
    { value: realCounts?.clinics?.toLocaleString() || "0", label: "Clinics", icon: Building2 },
    { value: realCounts?.cities?.toLocaleString() || "0", label: "Areas", icon: MapPin },
    { value: "4.9★", label: "Rating", icon: Star },
    { value: "60s", label: "To Book", icon: Zap },
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

  const headingFont = "'Varela Round', 'Quicksand', system-ui, sans-serif";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoContent?.meta_title || "Find the Best Dentists in Dubai & UAE | AppointPanda"}
        description={seoContent?.meta_description || "Search verified DHA & DOH licensed dentists across Dubai, Abu Dhabi, Sharjah & all 7 Emirates. Compare reviews, check AED pricing & book appointments online."}
        canonical="/"
        keywords={['dentist in dubai', 'dental clinics UAE', 'DHA licensed dentist', 'dentist abu dhabi', 'best dentist sharjah', 'dental implants dubai', 'teeth whitening UAE']}
      />
      <StructuredData type="organization" />
      <SyncStructuredData data={{ type: 'webSite', name: 'AppointPanda', url: 'https://www.appointpanda.ae', searchUrl: 'https://www.appointpanda.ae/search' }} />
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO — Full-viewport, dark background
          ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[100svh] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="container relative z-10 py-20 md:py-24 lg:py-28 px-5 md:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap gap-2.5 mb-8 md:mb-10 justify-center lg:justify-start"
            >
              <span className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-md border border-primary/30 rounded-full px-4 py-2 shadow-lg">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-bold text-primary">DHA & DOH Verified</span>
              </span>
              <span className="inline-flex items-center gap-2 bg-gold/15 backdrop-blur-md border border-gold/30 rounded-full px-4 py-2 shadow-lg">
                <Star className="h-4 w-4 text-gold fill-gold" />
                <span className="text-xs md:text-sm font-bold text-gold">4.9★ Rated Platform</span>
              </span>
              <span className="inline-flex items-center gap-2 bg-emerald/15 backdrop-blur-md border border-emerald/30 rounded-full px-4 py-2 shadow-lg">
                <Users className="h-4 w-4 text-emerald" />
                <span className="text-xs md:text-sm font-bold text-emerald">Expat-Friendly</span>
              </span>
            </motion.div>

            <div className="grid lg:grid-cols-[1fr,auto] gap-10 lg:gap-16 items-center">
              {/* Left: Headlines + Search */}
              <div className="text-center lg:text-left">
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

              {/* Right: Stats grid — hidden on mobile, visible on lg */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="hidden lg:grid grid-cols-2 gap-4 w-[280px]"
              >
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-3xl p-5 text-center hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
                  >
                    <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-black text-white" style={{ fontFamily: headingFont }}>{stat.value}</div>
                    <div className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Mobile stats — horizontal scroll */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:hidden grid grid-cols-4 gap-2.5 mt-8"
            >
              {stats.map((stat, i) => (
                <div key={i} className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                  <div className="text-lg font-black text-white" style={{ fontFamily: headingFont }}>{stat.value}</div>
                  <div className="text-[9px] font-bold text-white/50 uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-12 md:h-16" preserveAspectRatio="none">
            <path d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BROWSE BY EMIRATE
          ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-background relative">
        <div className="container px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14"
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2.5 mb-5">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Browse by Emirate</span>
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground" style={{ fontFamily: headingFont }}>
              Find Dentists in Your{" "}
              <span className="text-primary">Emirate</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-base md:text-lg">
              Select your emirate to discover DHA & DOH licensed dental professionals near you.
            </p>
          </motion.div>

          {/* Emirates as circular badges with infinite scroll list */}
          <div className="overflow-hidden">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex gap-8 md:gap-10 py-4 animate-scroll max-w-none mt-6 w-max"
            >
              {[...states, ...states].map((state, index) => (
                <EmirateCard key={`${state.slug}-${index}`} state={state} index={index} />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POPULAR AREAS
          ══════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-muted/30 relative">
        <div className="container px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground" style={{ fontFamily: headingFont }}>
              Popular <span className="text-primary">Areas</span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Browse dentists in top neighborhoods across Dubai, Abu Dhabi & Sharjah.
            </p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-x-2 gap-y-2 max-w-4xl mx-auto"
          >
            {popularAreas.map((area, i) => (
              <motion.span key={area.slug} variants={staggerItem} className="inline-flex items-center">
                <Link
                  to={`/${area.slug}/`}
                  className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors text-sm md:text-base"
                >
                  {area.name}
                </Link>
                {i < popularAreas.length - 1 && <span className="text-muted-foreground ml-2">·</span>}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY CHOOSE US — 4-card dark section
          ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-[10%] w-48 h-48 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 left-[5%] w-40 h-40 bg-teal/10 rounded-full blur-[80px]" />
        </div>
        <div className="container relative z-10 max-w-6xl px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 md:mb-14"
          >
            <span className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-5 py-2.5 mb-5 border border-primary/30">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Why AppointPanda</span>
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white" style={{ fontFamily: headingFont }}>
              The UAE's Trusted{" "}
              <span className="text-primary">Dental Directory</span>
            </h2>
            <p className="text-white/50 mt-3 max-w-xl mx-auto text-base md:text-lg">
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
        <section className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10 text-center"
            >
              <span className="inline-flex items-center gap-2 bg-gold/10 rounded-full px-5 py-2.5 mb-5">
                <Star className="h-4 w-4 text-gold fill-gold" />
                <span className="text-sm font-bold text-gold">Elite Selection</span>
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground" style={{ fontFamily: headingFont }}>
                Top Rated <span className="text-primary">Dentists</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-base md:text-lg">
                Browse our highest-rated dental professionals across all 7 Emirates.
              </p>
            </motion.div>
            <AutoScrollCarousel doctors={carouselProfiles} autoScrollSpeed={25} />
            <div className="mt-10 text-center">
              <Button asChild size="lg" className="rounded-2xl font-black px-10 h-14 text-base shadow-lg shadow-primary/20" style={{ fontFamily: headingFont }}>
                <Link to="/search">
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
      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="container relative z-10 px-5 md:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card/60 backdrop-blur-sm p-8 md:p-12">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
              <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div>
                <span className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2.5 mb-5 border border-primary/20">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">Comprehensive Care</span>
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground" style={{ fontFamily: headingFont }}>
                  Dental <span className="text-primary">Services</span>
                </h2>
                <p className="text-muted-foreground mt-3 text-base md:text-lg max-w-lg">
                  Find specialists for every dental need across the UAE. AED pricing on all profiles.
                </p>
              </div>
              <Link to="/services" className="group inline-flex items-center gap-2 text-primary hover:text-primary/80 font-bold transition-all">
                View All Services <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {treatments?.map((treatment) => (
                <Link
                  key={treatment.id}
                  to={`/services/${treatment.slug}`}
                  className="group relative bg-background/60 border border-border rounded-2xl p-4 md:p-5 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">{treatment.name}</span>
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                      <ArrowRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-all" />
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
          FAQ SECTION
          ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-muted/20 relative">
        <div className="container px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-10"
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2.5 mb-5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">UAE Dental FAQ</span>
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground" style={{ fontFamily: headingFont }}>
              Common <span className="text-primary">Questions</span>
            </h2>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-3">
            {uaeFaqs.map((faq, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="group bg-card border border-border rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 font-bold text-foreground hover:text-primary transition-colors text-sm md:text-base" style={{ fontFamily: headingFont }}>
                  {faq.q}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-open:rotate-90 transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="rounded-2xl font-black" style={{ fontFamily: headingFont }}>
              <Link to="/faq">View All FAQs <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS — 3 Steps
          ══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="container relative z-10 px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2.5 mb-5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Simple 3-Step Process</span>
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-3" style={{ fontFamily: headingFont }}>
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              Finding your perfect dentist in the UAE has never been easier.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-[calc(50%+20px)] left-[calc(50%-340px)] right-[calc(50%-340px)] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full" />

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-6 lg:gap-10"
            >
              {[
                { step: 1, icon: Search, title: "Search Your Area", desc: "Enter your emirate, area, or neighborhood and tell us what dental care you need." },
                { step: 2, icon: CheckCheck, title: "Compare & Choose", desc: "Browse verified profiles, check AED pricing, and read real patient reviews." },
                { step: 3, icon: Calendar, title: "Book in Seconds", desc: "Schedule your appointment instantly online. Get confirmation automatically." },
              ].map((item) => (
                <motion.div key={item.step} variants={staggerItem}>
                  <div className="group bg-card rounded-3xl p-7 md:p-8 border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-400 h-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center mx-auto mb-5 text-xl font-black shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform" style={{ fontFamily: headingFont }}>
                      {item.step}
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-foreground mb-3" style={{ fontFamily: headingFont }}>
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="rounded-2xl font-black px-10 h-14 text-base shadow-lg shadow-primary/20" style={{ fontFamily: headingFont }}>
              <Link to="/search">
                Start Your Search <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
          ══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal/10 rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />

        <div className="container relative z-10 px-5 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2.5 bg-primary/20 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8 border border-primary/30">
                <Heart className="h-4 w-4 text-primary fill-primary animate-pulse" />
                <span className="text-sm font-bold text-primary">Your Smile Matters</span>
              </span>

              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1]" style={{ fontFamily: headingFont }}>
                Ready to Find Your
                <span className="block text-primary mt-2">Perfect Dentist?</span>
              </h2>

              <p className="text-lg md:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
                Join thousands of patients across Dubai, Abu Dhabi & Sharjah who've discovered exceptional dental care through our platform.
              </p>

              <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-12">
                {[
                  { value: `${realCounts?.clinics?.toLocaleString() || '0'}+`, label: "Verified Practices" },
                  { value: "4.9★", label: "Average Rating" },
                  { value: "7", label: "Emirates Covered" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-black text-primary mb-1" style={{ fontFamily: headingFont }}>{s.value}</div>
                    <div className="text-sm text-white/40 font-semibold">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="rounded-2xl font-black px-10 h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30" style={{ fontFamily: headingFont }}>
                  <Link to="/search">
                    Find a Dentist <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl font-black px-10 h-14 text-lg border-2 border-white/20 text-white bg-white/5 hover:bg-white/10" style={{ fontFamily: headingFont }}>
                  <Link to="/list-your-practice">
                    <Stethoscope className="mr-2 h-5 w-5" /> I'm a Dentist
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
