'use client';
import { motion } from "framer-motion";
import { Search, Shield, FileText, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/SearchBox";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

interface HeroBannerProps {
  treatmentName?: string;
  locationName?: string;
  stateSlug?: string;
  citySlug?: string;
  serviceSlug?: string;
  stats?: {
    specialistsCount?: number;
    avgRating?: number;
  };
  variant?: "default" | "service-location";
  breadcrumbsItems?: { label: string; href?: string }[];
}

export const HeroBanner = ({
  treatmentName = "Dental Care",
  locationName = "UAE",
  stateSlug = "",
  citySlug = "",
  serviceSlug = "",
  stats,
  variant = "default",
  breadcrumbsItems,
}: HeroBannerProps) => {
  const displayLocation = variant === "service-location" ? locationName : "";
  const headline = variant === "service-location" 
    ? `${treatmentName} in ${locationName}` 
    : "Dental Care, Simplified.";
  const subtitle = variant === "service-location"
    ? `Curated clinical excellence in ${locationName}. Access top-tier dental professionals through our editorial vetting process.`
    : "The easiest way to book your next dental appointment.";

  return (
    <header className="relative pt-24 pb-24 md:pt-40 md:pb-40 bg-[#111c29] overflow-hidden">
      {/* Wireframe Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />
      
      {/* Wireframe Vertical Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[1px] h-full left-1/4 opacity-50 bg-[#2eb2a5]/15" />
        <div className="absolute w-[1px] h-full left-3/4 opacity-30 bg-[#2eb2a5]/15" />
        <div className="absolute w-full h-[1px] top-1/3 opacity-20 bg-[#2eb2a5]/15" />
        <div className="absolute w-full h-[1px] bottom-1/4 opacity-40 bg-[#2eb2a5]/15" />
        {/* Diagonal accents */}
        <div className="absolute top-0 right-0 w-[800px] h-[1px] bg-[#2eb2a5]/20 -rotate-45 origin-top-right" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[1px] bg-[#2eb2a5]/10 -rotate-45 origin-bottom-left" />
      </div>
      
      {/* Blur Orb */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2eb2a5] rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Location Label */}
          {variant === "service-location" && (
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-[#2eb2a5] uppercase mb-4 md:mb-6">
              {displayLocation} Precision Care
            </span>
          )}
          
          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] tracking-[-0.03em] mb-6 md:mb-8"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {headline}
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 leading-relaxed mb-10 md:mb-16 max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>

          {/* Glassmorphism Search Block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md p-3 rounded-xl flex flex-col md:flex-row gap-3 max-w-3xl mx-auto border border-white/10 shadow-2xl"
          >
            <div className="flex-1 flex items-center px-6 bg-white/5 rounded-lg border border-white/5">
              <Search className="h-5 w-5 text-white/60 mr-3 flex-shrink-0" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-white placeholder-white/40 w-full py-4 text-base md:text-lg" 
                placeholder="Search treatment or doctor" 
                type="text"
              />
            </div>
            <button className="bg-[#2eb2a3] text-white px-8 md:px-10 py-3 md:py-4 rounded-lg font-bold hover:bg-[#25998e] transition-all shadow-[0_4px_20px_rgba(46,178,165,0.4)] active:scale-95 text-base md:text-lg whitespace-nowrap">
              Search Results
            </button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-x-10 gap-y-4 mt-8 md:mt-12"
          >
            <div className="flex items-center text-white/50 text-xs font-bold tracking-widest uppercase">
              <Shield className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#2eb2a5] mr-2" />
              DHA Licensed
            </div>
            <div className="flex items-center text-white/50 text-xs font-bold tracking-widest uppercase">
              <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#2eb2a5] mr-2" />
              Insurance Accepted
            </div>
            <div className="flex items-center text-white/50 text-xs font-bold tracking-widest uppercase">
              <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#2eb2a5] mr-2" />
              Instant Booking
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default HeroBanner;