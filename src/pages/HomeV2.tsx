'use client';
import { useState } from "react";
import { 
  ArrowRight, Shield, Star, MapPin, 
  Heart, Search, Building2, Stethoscope, Calendar,
  ChevronRight, BadgeCheck, Timer,
  Quote, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBox } from "@/components/SearchBox";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { useSeoPageContent } from "@/hooks/useSeoPageContent";
import { useStatesWithClinics } from "@/hooks/useLocations";
import { useRealCounts } from "@/hooks/useRealCounts";
import { useTreatments } from "@/hooks/useTreatments";
import { useTopDentistsPerLocation } from "@/hooks/useProfiles";
import { AutoScrollCarousel } from "@/components/AutoScrollCarousel";
import { ACTIVE_STATES } from "@/lib/constants/activeStates";
import heroDentalFamily from "@/assets/hero-dental-family.jpg";
import dentalPracticeGrowth from "@/assets/dental-practice-growth.jpg";
import pandaMascot from "@/assets/panda-mascot.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const HomeV2 = () => {
  const navigate = useNavigate();
  const { data: _states } = useStatesWithClinics();
  const { data: realCounts } = useRealCounts();
  const { data: treatments } = useTreatments();
  const { data: profiles } = useTopDentistsPerLocation(30);
  const { data: seoContent } = useSeoPageContent("/");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const { data: dubaiAreas } = useQuery({
    queryKey: ['dubai-areas-homepage'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cities')
        .select('id, name, slug, dentist_count, states!inner(slug)')
        .eq('is_active', true)
        .eq('states.slug', 'dubai')
        .order('name')
        .limit(15);
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: sharjahAreas } = useQuery({
    queryKey: ['sharjah-areas-homepage'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cities')
        .select('id, name, slug, dentist_count, states!inner(slug)')
        .eq('is_active', true)
        .eq('states.slug', 'sharjah')
        .order('name')
        .limit(10);
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const testimonials = [
    {
      name: "Fatima A.",
      location: "Dubai Marina, Dubai",
      text: "Found an amazing cosmetic dentist in JLT within my budget. The whole process took less than 5 minutes!",
      rating: 5,
    },
    {
      name: "Ahmed R.",
      location: "Al Majaz, Sharjah",
      text: "I was nervous about finding a new dentist after moving to Sharjah. AppointPanda made it so easy to compare clinics.",
      rating: 5,
    },
    {
      name: "Sarah K.",
      location: "Khalifa City, Abu Dhabi",
      text: "The reviews and AED pricing were super helpful. Found a great pediatric dentist for my kids!",
      rating: 5,
    },
  ];

  const popularTreatments = treatments?.slice(0, 8) || [];

  const carouselProfiles = profiles?.map(p => ({
    name: p.name,
    specialty: p.specialty || 'Dental Professional',
    location: p.location || 'UAE',
    rating: p.rating,
    image: p.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    slug: p.slug,
    type: p.type,
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoContent?.meta_title || "Find the Best Dentists in UAE | Dentist in Dubai"}
        description={seoContent?.meta_description || "Find and book appointments with top-rated dental professionals across the UAE. Compare verified clinics in Dubai, Sharjah, Abu Dhabi."}
        canonical="/"
      />
      <Navbar />

      {/* ══════════ HERO — Full-width background, centered content ══════════ */}
      <section className="relative min-h-[520px] md:min-h-[580px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img 
            src={heroDentalFamily} 
            alt="Happy family at dental clinic" 
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/55 to-foreground/75" />
        </div>

        {/* Centered content */}
        <div className="relative z-10 container px-4 py-16 md:py-20 text-center">
          <motion.div {...fadeUp} className="inline-flex items-center gap-2 bg-background/15 backdrop-blur-sm border border-background/20 rounded-full px-4 py-1.5 mb-6">
            <BadgeCheck className="h-4 w-4 text-background" />
            <span className="text-xs font-semibold text-background">UAE's Trusted Dental Directory</span>
          </motion.div>

          <motion.h1 {...fadeUp} transition={{ delay: 0.1 }} className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-background leading-[1.15] mb-4 max-w-3xl mx-auto">
            Find Your Perfect{" "}
            <span className="text-primary">Dentist</span>{" "}
            in the UAE
          </motion.h1>

          <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="text-base md:text-lg text-background/80 leading-relaxed mb-8 max-w-xl mx-auto">
            Compare verified clinics, read real reviews, check AED pricing — and book in under 60 seconds.
          </motion.p>

          {/* Trust indicators */}
          <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-8">
            {[
              { icon: Shield, text: "DHA Verified" },
              { icon: Star, text: "4.9 Rating" },
              { icon: Building2, text: `${realCounts?.clinics?.toLocaleString() || '500+'} Clinics` },
              { icon: Timer, text: "60s Booking" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-background/70">
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-xl font-semibold h-12 px-8 shadow-lg" onClick={() => navigate("/search")}>
              <Search className="mr-2 h-4 w-4" />
              Find a Dentist
            </Button>
            <Button size="lg" variant="outline" className="rounded-xl font-semibold h-12 px-8 bg-background/10 border-background/30 text-background hover:bg-background/20 hover:text-background" asChild>
              <Link to="/list-your-practice">
                <Stethoscope className="mr-2 h-4 w-4" />
                I'm a Dentist
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ══════════ SEARCH BAR ══════════ */}
      <section className="relative -mt-8 z-20 pb-12">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <SearchBox variant="hero" />
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">How It Works</span>
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Book in <span className="text-primary">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">Finding the right dentist shouldn't be complicated.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Search", description: "Select your emirate, area, and the dental service you need.", icon: Search, gradient: "from-primary/15 to-primary/5" },
              { step: "02", title: "Compare", description: "Browse verified clinic profiles, real reviews, and AED pricing.", icon: Star, gradient: "from-gold/15 to-gold/5" },
              { step: "03", title: "Book", description: "Schedule your appointment online in under 60 seconds.", icon: Calendar, gradient: "from-primary/15 to-teal/5" },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center group"
              >
                <div className={`relative bg-gradient-to-br ${item.gradient} border border-primary/10 rounded-2xl p-6 hover:shadow-lg hover:border-primary/25 transition-all duration-300`}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                    {item.step}
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 mt-2 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WHY CHOOSE US ══════════ */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
            {/* Image — Panda mascot */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl -z-10" />
                <img src={pandaMascot} alt="AppointPanda mascot" className="w-64 md:w-80 h-auto rounded-2xl" loading="lazy" />
              </div>
            </motion.div>
            
            {/* Content */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">Why Choose Us</span>
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Why Patients Trust <span className="text-primary">AppointPanda</span>
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Shield, title: "DHA & MOHAP Verified", desc: "Every listed clinic is verified against UAE health authority standards." },
                  { icon: Star, title: "Real Patient Reviews", desc: "Authentic, unfiltered reviews from actual patients across UAE." },
                  { icon: Heart, title: "Transparent AED Pricing", desc: "Clear cost ranges in AED for every dental service." },
                  { icon: Timer, title: "Book in 60 Seconds", desc: "No phone calls needed. Schedule your appointment instantly online." },
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-3.5 group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-foreground mb-0.5">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ BROWSE BY EMIRATE ══════════ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Browse by <span className="text-primary">Emirate</span>
            </h2>
            <p className="text-sm text-muted-foreground">Find dental clinics across all seven UAE Emirates</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {ACTIVE_STATES.map((emirate) => (
              <Link
                key={emirate.slug}
                to={`/${emirate.slug}`}
                className="bg-card border border-border rounded-xl px-5 py-3 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm hover:shadow-md"
              >
                <MapPin className="inline h-3.5 w-3.5 mr-1.5 opacity-50" />
                {emirate.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TOP AREAS ══════════ */}
      {dubaiAreas && dubaiAreas.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container px-4">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                Popular Areas in <span className="text-primary">Dubai</span>
              </h2>
            </motion.div>
            <div className="flex flex-wrap gap-2">
              {dubaiAreas.map((area) => (
                <Link key={area.id} to={`/dubai/${area.slug}`} className="inline-flex items-center gap-1.5 bg-muted/60 border border-border/50 rounded-lg px-3.5 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all">
                  <MapPin className="h-3 w-3 text-primary/60" />
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {sharjahAreas && sharjahAreas.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container px-4">
            <motion.div {...fadeUp} className="mb-6">
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                Popular Areas in <span className="text-primary">Sharjah</span>
              </h2>
            </motion.div>
            <div className="flex flex-wrap gap-2">
              {sharjahAreas.map((area) => (
                <Link key={area.id} to={`/sharjah/${area.slug}`} className="inline-flex items-center gap-1.5 bg-background border border-border/50 rounded-lg px-3.5 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all">
                  <MapPin className="h-3 w-3 text-primary/60" />
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ TREATMENTS ══════════ */}
      {popularTreatments.length > 0 && (
        <section className="py-16 md:py-20 bg-background">
          <div className="container px-4">
            <motion.div {...fadeUp} className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">Dental <span className="text-primary">Services</span></h2>
                <p className="text-sm text-muted-foreground">Find specialists for every dental need</p>
              </div>
              <Link to="/services" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                All Services <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {popularTreatments.map((treatment, i) => (
                <motion.div key={treatment.id} {...fadeUp} transition={{ delay: i * 0.04 }}>
                  <Link to={`/services/${treatment.slug}`} className="group flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{treatment.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="md:hidden text-center mt-6">
              <Link to="/services" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View All Services <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">What <span className="text-primary">Patients</span> Say</h2>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-base md:text-lg text-foreground leading-relaxed mb-5">"{testimonials[activeTestimonial].text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{testimonials[activeTestimonial].name}</p>
                    <p className="text-xs text-muted-foreground">{testimonials[activeTestimonial].location}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-gold fill-gold" />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-5">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} className={`h-2 rounded-full transition-all ${i === activeTestimonial ? 'bg-primary w-6' : 'bg-border w-2 hover:bg-muted-foreground/40'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ DENTIST CAROUSEL ══════════ */}
      {carouselProfiles.length > 0 && (
        <section className="py-16 md:py-20 bg-background">
          <div className="container px-4">
            <motion.div {...fadeUp} className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Top-Rated <span className="text-primary">Dental Professionals</span></h2>
              <p className="text-sm text-muted-foreground">Verified dentists with excellent patient reviews across UAE</p>
            </motion.div>
            <AutoScrollCarousel doctors={carouselProfiles} autoScrollSpeed={25} />
            <div className="text-center mt-8">
              <Button variant="outline" className="rounded-xl font-medium" asChild>
                <Link to="/search">View Full Directory <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════ FOR DENTISTS ══════════ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <motion.div {...fadeUp}>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={dentalPracticeGrowth} alt="Grow your dental practice" className="w-full h-auto object-cover aspect-[4/3]" loading="lazy" />
              </div>
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                Grow Your Practice with <span className="text-primary">AppointPanda</span>
              </h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Join dental professionals across the UAE who trust our platform to reach patients, manage bookings, and build their reputation.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  "Reach patients across all 7 Emirates",
                  "Smart scheduling reduces no-shows",
                  "Collect & showcase patient reviews",
                  "Free listing to get started",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Button className="rounded-xl font-semibold" asChild>
                <Link to="/list-your-practice">
                  List Your Practice Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ ABOUT ══════════ */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                About <span className="text-primary">AppointPanda</span>
              </h2>
            </motion.div>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                AppointPanda is the UAE's leading dental directory platform, built to help patients across Dubai, Sharjah, Abu Dhabi, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain find trusted dental professionals. Whether you need teeth cleaning, implants, Invisalign, or emergency care, we connect you with verified clinics — all with transparent AED pricing and real patient reviews.
              </p>
              <p>
                Every clinic listed is verified against DHA, DoH, and MOHAP standards. Our platform covers {realCounts?.clinics?.toLocaleString() || '500'}+ dental practices offering {treatments?.length || '15'}+ services including cosmetic dentistry, orthodontics, pediatric care, and oral surgery.
              </p>
            </div>
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              {[
                { to: "/about/", icon: Heart, label: "Our Mission" },
                { to: "/insurance/", icon: Shield, label: "Insurance Guide" },
                { to: "/how-it-works/", icon: Search, label: "How It Works" },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 bg-card border border-border rounded-xl p-3.5 hover:border-primary/30 transition-all group">
                  <link.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Frequently Asked <span className="text-primary">Questions</span>
              </h2>
            </motion.div>
            <div className="space-y-3">
              {[
                { q: "How do I find a dentist near me in Dubai?", a: "Use AppointPanda's search to select your emirate and area. Browse verified clinic profiles with real patient reviews, AED pricing, and available services." },
                { q: "Is AppointPanda free for patients?", a: "Yes, AppointPanda is completely free for patients. Search, compare, and book appointments across all seven UAE Emirates at no cost." },
                { q: "Are the dentists on AppointPanda verified?", a: "All clinics are verified against DHA, DoH, and MOHAP standards. Look for the verified badge on clinic profiles." },
                { q: "Can I search by dental insurance provider?", a: "Yes. Use our insurance search to find dentists who accept your plan — including Daman, Oman Insurance, AXA, and MetLife." },
                { q: "How accurate are the prices shown?", a: "Prices shown are estimated ranges in AED. Final costs require an in-person consultation. We encourage confirming pricing directly with your chosen clinic." },
              ].map((faq, i) => (
                <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.04 }} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
                  <h3 className="font-display text-sm font-bold text-foreground mb-1.5">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/faq/" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all FAQs <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-16 md:py-20 bg-primary/5 border-t border-primary/10">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Find Your <span className="text-primary">Perfect Dentist?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of patients across Dubai, Sharjah, and Abu Dhabi who've found exceptional dental care through our platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" className="rounded-xl font-semibold h-12 px-8" asChild>
                <Link to="/search">
                  Find a Dentist <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl font-semibold h-12 px-8 border-border" asChild>
                <Link to="/list-your-practice">
                  <Stethoscope className="mr-2 h-4 w-4" /> I'm a Dentist
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomeV2;
