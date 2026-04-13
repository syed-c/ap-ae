'use client';
import { motion } from "framer-motion";
import { FileText, Sparkles, Activity, AlertCircle, MoreHorizontal } from "lucide-react";

interface PricingCard {
  title: string;
  price: string;
  icon?: string;
}

interface PricingCardsProps {
  treatmentName: string;
  locationName: string;
  treatmentOptions?: {
    name: string;
    price_min: number;
    price_max: number;
    description?: string;
  }[];
}

const iconMap: Record<string, any> = {
  "file_text": FileText,
  "sparkles": Sparkles,
  "activity": Activity,
  "alert_circle": AlertCircle,
  "more_horizontal": MoreHorizontal,
};

const defaultPricing: PricingCard[] = [
  { title: "Routine Checkup", price: "AED 350+", icon: "file_text" },
  { title: "Teeth Whitening", price: "AED 1,200+", icon: "sparkles" },
  { title: "Scaling & Polishing", price: "AED 450+", icon: "activity" },
  { title: "Emergency Visit", price: "AED 500+", icon: "alert_circle" },
];

export const PricingCards = ({
  treatmentName,
  locationName,
  treatmentOptions,
}: PricingCardsProps) => {
  const cards = treatmentOptions && treatmentOptions.length > 0 
    ? treatmentOptions.slice(0, 4).map((opt, idx) => ({
        title: opt.name,
        price: opt.price_max ? `AED ${opt.price_max.toLocaleString()}+` : "Contact for pricing",
        icon: defaultPricing[idx % 4].icon,
      }))
    : defaultPricing;

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-8 md:mb-12 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-700">Estimated Care Costs</h2>
        <div className="h-px flex-1 bg-slate-200 hidden md:block mx-4 md:mx-8" />
        <p className="text-slate-500 text-sm max-w-xs italic hidden md:block">
          Prices are indicative. Final quotes provided post-consultation.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {cards.map((card, index) => {
          const IconComponent = iconMap[card.icon || "file_text"] || FileText;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-4 md:p-8 bg-white rounded-lg group hover:shadow-[0_20px_40px_rgba(17,28,41,0.05)] transition-all border border-slate-100 hover:border-primary/20"
            >
              <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-primary mb-3 md:mb-4" />
              <h3 className="font-bold text-slate-700 mb-1 md:mb-2 text-sm md:text-base">{card.title}</h3>
              <p className="text-xl md:text-2xl font-black text-primary">{card.price}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PricingCards;