import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArrowRight, Shield, Clock, Building2, CheckCircle, Star } from "lucide-react";
import { useRealCounts } from "@/hooks/useRealCounts";
import { useSeoPageContent } from "@/hooks/useSeoPageContent";
import { motion } from "framer-motion";

const ServicesPage = () => {
  const { data: treatments, isLoading } = useQuery({
    queryKey: ["all-treatments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("treatments")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
  });

  // Fetch states for interlinking
  const { data: states } = useQuery({
    queryKey: ["states-for-services"],
    queryFn: async () => {
      const { data } = await supabase
        .from("states")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
  });

  const popularTreatments = treatments?.slice(0, 8) || [];
  const allTreatments = treatments || [];
  
  // Get real clinic count
  const { data: realCounts } = useRealCounts();
  const { data: seoContent } = useSeoPageContent("services");

  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Dental Services" }];

  return (
    <PageLayout>
      <SEOHead
        title={seoContent?.meta_title || "Dental Services - All Treatments"}
        description={seoContent?.meta_description || "Explore our comprehensive range of dental treatments. Find teeth whitening, veneers, dental implants, Invisalign, and more from verified specialists across the UAE."}
        canonical="/services/"
        keywords={['dental services', 'dental treatments', 'teeth whitening', 'dental implants', 'Invisalign', 'cosmetic dentistry']}
      />
      
      {/* Hero Section — Dark theme matching homepage */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-start bg-slate-950 pt-4 md:pt-6 lg:pt-8">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-[30%] -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-primary/30 via-primary/15 to-transparent rounded-b-[100%] blur-[180px]"
          />
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/4 left-[30%] -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-0 left-[30%] -translate-x-1/2 w-[1000px] h-[300px] bg-slate-900 rounded-t-[100%] blur-[100px]"
          />
        </div>
        
        <div className="container relative z-10 w-full py-8 md:py-12 lg:py-16 px-4 md:px-6">
          <Breadcrumbs items={breadcrumbs} className="mb-6 [&_a]:text-white/60 [&_span]:text-white/40 [&_svg]:text-white/30" />
          
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap gap-2.5 mb-6 justify-center"
            >
              <span className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-md border border-primary/30 rounded-full px-4 py-2 shadow-lg">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-xs md:text-sm font-bold text-primary">DHA & DOH Verified</span>
              </span>
              <span className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-md border border-primary/30 rounded-full px-4 py-2 shadow-lg">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-xs md:text-sm font-bold text-primary">4.9★ Rated Platform</span>
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="leading-[1.05] mb-5"
              style={{ fontFamily: "'Nunito', 'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black text-white tracking-tight">
                Dental
              </span>
              <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black text-primary tracking-tight mt-1">
                Services
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8"
            >
              Explore our comprehensive range of dental treatments. Find the right service for your needs and connect with verified specialists across the UAE.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-3"
            >
              <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3">
                <span className="font-bold text-white">{allTreatments.length}+ Treatments</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-bold text-white">{realCounts?.clinics?.toLocaleString() || '6,000'}+ Clinics</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-bold text-white">Top Specialists</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-bold text-white">Book in 60s</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-12 md:h-16" preserveAspectRatio="none">
            <path d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Most Searched - Dark Cards like Why AppointPanda */}
      <section className="bg-slate-950 py-16 md:py-20 lg:py-24 relative overflow-hidden">
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
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Most Searched</span>
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white" style={{ fontFamily: "'Nunito', 'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Popular Dental{" "}
              <span className="text-primary">Treatments</span>
            </h2>
            <p className="text-white/50 mt-2 md:mt-3 max-w-xl mx-auto text-sm md:text-base">
              Browse our most popular dental services across all 7 Emirates.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {popularTreatments.map((treatment, i) => (
                <motion.div key={treatment.id} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link
                    href={`/services/${treatment.slug}/`}
                    className="group bg-white/[0.04] backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300 block h-full"
                  >
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors mb-2">
                      {treatment.name}
                    </h3>
                    {treatment.description && (
                      <p className="text-sm text-white/45 line-clamp-2 mb-3">
                        {treatment.description}
                      </p>
                    )}
                    <span className="text-sm font-bold text-primary flex items-center gap-1 justify-center">
                      Learn More <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Full Directory - Light Section */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="container">
          <div className="text-center mb-10">
            <p className="text-sm font-bold text-primary mb-3">Full Directory</p>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              All Dental <span className="text-primary">Services</span>
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {allTreatments.map((treatment, i) => (
              <Link
                key={treatment.id}
                href={`/services/${treatment.slug}/`}
                className="bg-card border border-border rounded-2xl px-5 py-3 font-bold text-foreground hover:border-primary hover:shadow-lg hover:text-primary transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {treatment.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services by State - Interlinking */}
      <Section size="lg">
        <SectionHeader
          label="By Location"
          title="Find Treatments"
          highlight="By Emirate"
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {states?.map((state, i) => (
            <Link
              key={state.id}
              href={`/${state.slug}`}
              className="group bg-card border border-border rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                {state.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Browse dental services in {state.abbreviation}
              </p>
              <span className="text-sm font-bold text-primary flex items-center gap-1">
                Explore <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-primary py-16 md:py-20">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Not sure what you need?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Book a consultation with a general dentist who can assess your needs and recommend the right treatment.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-2xl font-bold">
            <Link href="/search/">
              Find a Dentist
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default ServicesPage;
