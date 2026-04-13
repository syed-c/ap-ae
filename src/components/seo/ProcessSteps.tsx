'use client';
import { motion } from "framer-motion";
import { Check, Calendar, UserCheck, Zap } from "lucide-react";

interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

const steps: ProcessStep[] = [
  { number: "01", title: "Select Treatment", description: "Choose from general, cosmetic, or specialist services." },
  { number: "02", title: "Pick Your Expert", description: "Compare profiles, reviews, and clinical expertise." },
  { number: "03", title: "Instant Confirmation", description: "Secure your slot with zero wait times." },
];

export const ProcessSteps = () => {
  return (
    <section className="py-12 md:py-20 border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-10 md:mb-16 text-center">Seamless Booking Architecture</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 relative">
          {/* Horizontal line */}
          <div className="hidden md:block absolute top-6 left-0 w-full h-[1px] bg-slate-300/50 -translate-y-1/2" />
          
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative z-10 text-center"
            >
              <div className="w-12 h-12 bg-white mx-auto flex items-center justify-center border-2 border-primary rounded-full mb-4 md:mb-6 shadow-sm">
                <span className="text-primary font-black text-sm">{step.number}</span>
              </div>
              <h4 className="font-bold text-slate-700 mb-2">{step.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;