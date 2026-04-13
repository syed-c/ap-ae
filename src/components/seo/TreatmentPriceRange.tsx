'use client';
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Clock, 
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PriceOption {
  type: string;
  name: string;
  price_min: number;
  price_max: number;
  duration?: string;
  visibility?: string;
  best_for?: string;
}

interface TreatmentPriceRangeProps {
  treatmentName: string;
  locationName: string;
  priceMin?: number;
  priceMax?: number;
  priceNote?: string;
  priceLastUpdated?: string;
  treatmentOptions?: PriceOption[];
  stateSlug?: string;
  citySlug?: string;
  serviceSlug?: string;
}

const DEFAULT_TREATMENT_OPTIONS: Record<string, PriceOption[]> = {
  "braces": [
    { type: "metal", name: "Metal Braces", price_min: 5000, price_max: 12000, duration: "18-24 months", visibility: "High", best_for: "Complex cases, budget-conscious" },
    { type: "ceramic", name: "Ceramic Braces", price_min: 7000, price_max: 15000, duration: "18-24 months", visibility: "Medium", best_for: "Adults seeking discreet option" },
    { type: "invisalign", name: "Invisalign/Clear Aligners", price_min: 12000, price_max: 25000, duration: "12-24 months", visibility: "Very Low", best_for: "Adults, professionals" },
    { type: "lingual", name: "Lingual Braces", price_min: 15000, price_max: 30000, duration: "18-30 months", visibility: "None", best_for: "Adults needing hidden treatment" },
  ],
  "invisalign": [
    { type: "invisalign-full", name: "Invisalign Full", price_min: 15000, price_max: 30000, duration: "12-24 months", visibility: "Very Low", best_for: "Complex cases" },
    { type: "invisalign-lite", name: "Invisalign Lite", price_min: 8000, price_max: 15000, duration: "6-12 months", visibility: "Very Low", best_for: "Mild corrections" },
    { type: "invisalign-first", name: "Invisalign First", price_min: 10000, price_max: 18000, duration: "6-12 months", visibility: "Very Low", best_for: "Children, teens" },
    { type: "braces-metal", name: "Metal Braces", price_min: 5000, price_max: 12000, duration: "18-24 months", visibility: "High", best_for: "All cases" },
  ],
  "dental-implants": [
    { type: "single-implant", name: "Single Dental Implant", price_min: 2500, price_max: 8000, duration: "3-6 months", visibility: "N/A", best_for: "Single tooth replacement" },
    { type: "all-on-4", name: "All-on-4 Implants", price_min: 18000, price_max: 35000, duration: "3-6 months", visibility: "N/A", best_for: "Full arch replacement" },
    { type: "all-on-6", name: "All-on-6 Implants", price_min: 22000, price_max: 45000, duration: "3-6 months", visibility: "N/A", best_for: "Full arch with extra support" },
    { type: "mini-implants", name: "Mini Implants", price_min: 1500, price_max: 4000, duration: "2-3 months", visibility: "N/A", best_for: "Denture stabilization" },
  ],
  "teeth-whitening": [
    { type: "in-office", name: "In-Office Whitening", price_min: 800, price_max: 2500, duration: "1-2 hours", visibility: "N/A", best_for: "Quick results" },
    { type: "take-home", name: "Take-Home Kit", price_min: 500, price_max: 1500, duration: "1-2 weeks", visibility: "N/A", best_for: "Convenience, gradual results" },
    { type: "zoom", name: "Zoom Whitening", price_min: 1200, price_max: 3000, duration: "1-2 hours", visibility: "N/A", best_for: "Professional results" },
    { type: "internal-bleaching", name: "Internal Bleaching", price_min: 600, price_max: 1500, duration: "30-60 min", visibility: "N/A", best_for: "Root canal treated teeth" },
  ],
  "root-canal-treatment": [
    { type: "anterior", name: "Anterior RCT", price_min: 800, price_max: 2000, duration: "1-2 visits", visibility: "N/A", best_for: "Front teeth" },
    { type: "posterior", name: "Posterior RCT", price_min: 1200, price_max: 3500, duration: "2-3 visits", visibility: "N/A", best_for: "Molars" },
    { type: "retreatment", name: "Retreatment", price_min: 2000, price_max: 5000, duration: "2-3 visits", visibility: "N/A", best_for: "Failed previous RCT" },
    { type: "apicoectomy", name: "Apicoectomy", price_min: 2500, price_max: 6000, duration: "1-2 visits", visibility: "N/A", best_for: "Persistent infection" },
  ],
  "dental-crowns": [
    { type: "metal-ceramic", name: "Metal-Ceramic Crown", price_min: 1200, price_max: 3000, duration: "1-2 weeks", visibility: "N/A", best_for: "Durability, budget" },
    { type: "zirconia", name: "Zirconia Crown", price_min: 2000, price_max: 5000, duration: "1-2 weeks", visibility: "N/A", best_for: "Aesthetics, strength" },
    { type: "e-max", name: "E-Max Crown", price_min: 2500, price_max: 6000, duration: "1-2 weeks", visibility: "N/A", best_for: "Best aesthetics" },
    { type: "temporary", name: "Temporary Crown", price_min: 200, price_max: 600, duration: "Same day", visibility: "N/A", best_for: "Emergency, interim" },
  ],
  "veneers": [
    { type: "composite", name: "Composite Veneers", price_min: 800, price_max: 2000, duration: "1-2 visits", visibility: "N/A", best_for: "Budget, minor changes" },
    { type: "porcelain", name: "Porcelain Veneers", price_min: 2500, price_max: 6000, duration: "2-3 visits", visibility: "N/A", best_for: "Long-lasting, natural" },
    { type: "lumineers", name: "Lumineers", price_min: 3000, price_max: 7000, duration: "2-3 visits", visibility: "N/A", best_for: "Minimal prep" },
    { type: "snap-on", name: "Snap-On Veneers", price_min: 2000, price_max: 5000, duration: "1-2 weeks", visibility: "N/A", best_for: "Removable option" },
  ],
  "tooth-extraction": [
    { type: "simple", name: "Simple Extraction", price_min: 200, price_max: 800, duration: "1 visit", visibility: "N/A", best_for: "Visible teeth" },
    { type: "surgical", name: "Surgical Extraction", price_min: 500, price_max: 2000, duration: "1 visit", visibility: "N/A", best_for: "Impacted teeth" },
    { type: "wisdom", name: "Wisdom Tooth Extraction", price_min: 800, price_max: 3000, duration: "1 visit", visibility: "N/A", best_for: "Third molars" },
    { type: "multiple", name: "Multiple Extractions", price_min: 400, price_max: 2500, duration: "1 visit", visibility: "N/A", best_for: "Multiple teeth" },
  ],
};

export const TreatmentPriceRange = ({
  treatmentName,
  locationName,
  priceMin,
  priceMax,
  priceNote,
  priceLastUpdated,
  treatmentOptions,
  stateSlug,
  citySlug,
  serviceSlug,
}: TreatmentPriceRangeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Use provided options or fall back to defaults
  const options = treatmentOptions || DEFAULT_TREATMENT_OPTIONS[serviceSlug || ""] || [];
  
  const formatPrice = (price: number) => price.toLocaleString();
  
  const displayMin = priceMin || Math.min(...options.map(o => o.price_min), 0);
  const displayMax = priceMax || Math.max(...options.map(o => o.price_max), 0);

  const selectedOptionData = selectedOption 
    ? options.find(o => o.type === selectedOption) 
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg shadow-primary/5"
    >
      {/* Header */}
      <div 
        className="p-4 md:p-5 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-teal-500/5 cursor-pointer hover:bg-primary/10 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">
                {treatmentName} Cost in {locationName}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {displayMin > 0 ? `AED ${formatPrice(displayMin)} - ${formatPrice(displayMax)}` : "Price on request"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {priceLastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Updated {priceLastUpdated}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 md:p-5 space-y-4">
              {/* Quick Answer Box - AIO Optimization */}
              {priceNote && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      {priceNote}
                    </p>
                  </div>
                </div>
              )}

              {/* Treatment Options Grid */}
              {options.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Treatment Options Available in {locationName}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {options.map((option, idx) => (
                      <button
                        key={option.type}
                        onClick={() => setSelectedOption(selectedOption === option.type ? null : option.type)}
                        className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                          selectedOption === option.type
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-foreground">{option.name}</span>
                          {option.visibility && option.visibility !== "N/A" && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              option.visibility === "None" || option.visibility === "Very Low"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : option.visibility === "Medium"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}>
                              {option.visibility}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-primary">
                            AED {formatPrice(option.price_min)} - {formatPrice(option.price_max)}
                          </span>
                          {option.duration && (
                            <span className="text-xs text-muted-foreground">{option.duration}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Option Details */}
              {selectedOptionData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                >
                  <h5 className="font-bold text-foreground mb-2">{selectedOptionData.name} Details</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Best For:</span>
                      <p className="font-medium text-foreground">{selectedOptionData.best_for}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium text-foreground">{selectedOptionData.duration}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      Estimated: AED {formatPrice(selectedOptionData.price_min)} - {formatPrice(selectedOptionData.price_max)}
                    </span>
                    <Link 
                      href={`/tools/dental-cost-calculator/`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Get personalized quote <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Cost Calculator Link */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={`/tools/dental-cost-calculator/`}>
                    <Calculator className="h-4 w-4 mr-2" />
                    Cost Calculator
                  </Link>
                </Button>
                {stateSlug && citySlug && serviceSlug && (
                  <Button asChild variant="ghost" className="rounded-xl text-muted-foreground">
                    <Link href={`/${stateSlug}/${citySlug}/`}>
                      View All {locationName} Services
                    </Link>
                  </Button>
                )}
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                <p>
                  Prices are estimates and may vary based on case complexity, materials, and clinic. 
                  Final costs require a consultation. Prices last updated {priceLastUpdated || "recently"}.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TreatmentPriceRange;