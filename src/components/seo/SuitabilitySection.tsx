'use client';
import { motion } from "framer-motion";
import { Check, X, Info } from "lucide-react";

interface SuitabilityItem {
  text: string;
}

interface SuitabilitySectionProps {
  treatmentName: string;
  locationName: string;
  recommended?: string[];
  notSuitable?: string[];
}

const defaultRecommended: SuitabilityItem[] = [
  { text: "Patients requiring annual preventative screenings." },
  { text: "Families seeking English-speaking specialists." },
  { text: "Those with immediate tooth pain or minor dental trauma." },
];

const defaultNotSuitable: SuitabilityItem[] = [
  { text: "Complex maxillofacial surgeries requiring hospital admission." },
  { text: "Severe dental phobia requiring general anesthesia." },
];

export const SuitabilitySection = ({
  treatmentName,
  locationName,
  recommended,
  notSuitable,
}: SuitabilitySectionProps) => {
  const recommendedItems = recommended || defaultRecommended.map(r => r.text);
  const notSuitableItems = notSuitable || defaultNotSuitable.map(r => r.text);

  return (
    <section className="py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
        {/* Recommended */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-6 md:p-12 bg-[#f0faf8] rounded-lg md:rounded-none md:rounded-l-lg border-l-4 border-primary"
        >
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-700">Ideal For</h3>
          </div>
          <ul className="space-y-3 md:space-y-4">
            {recommendedItems.slice(0, 5).map((item, index) => (
              <li key={index} className="flex items-start text-sm md:text-base text-slate-600">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Not Suitable */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-6 md:p-12 bg-[#fff4f2] rounded-lg md:rounded-none md:rounded-r-lg border-l-4 md:border-l-0 md:border-r-4 border-red-500"
        >
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-700">Not Suitable For</h3>
          </div>
          <ul className="space-y-3 md:space-y-4">
            {notSuitableItems.slice(0, 5).map((item, index) => (
              <li key={index} className="flex items-start text-sm md:text-base text-slate-600">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

export default SuitabilitySection;