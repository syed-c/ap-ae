'use client';
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  CalendarCheck,
  User,
  UserCheck,
  Stethoscope,
  Activity,
  ArrowRight,
  Smile,
  Sparkles,
  Shield,
  Pill,
  Scissors,
  HeartHandshake,
  Microscope,
  Loader2,
  Palmtree
} from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, any> = {
  "initial consultation": CalendarCheck,
  "consultation": CalendarCheck,
  "book a consultation": Calendar,
  "diagnosis": Microscope,
  "comprehensive examination": Stethoscope,
  "treatment planning": ClipboardList,
  "discuss treatment options": User,
  "treatment": Activity,
  "undergo treatment": Activity,
  "check-up": CalendarCheck,
  "follow-up": Calendar,
  "schedule follow-up appointments": Calendar,
  "assessment": Stethoscope,
  "cleaning": Sparkles,
  "examination": Stethoscope,
  "x-rays": Microscope,
  "scan": Microscope,
  "impression": ClipboardList,
  "fitting": UserCheck,
  "placement": Palmtree,
  "final placement": CheckCircle2,
  "debonding": Scissors,
  "retainers": Shield,
};

function getStepIcon(title: string): any {
  const normalizedTitle = title.toLowerCase();
  for (const key of Object.keys(iconMap)) {
    if (normalizedTitle.includes(key)) {
      return iconMap[key];
    }
  }
  return ClipboardList; // default icon
}

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  duration?: string;
  icon?: string;
}

interface TreatmentProcessStepsProps {
  treatmentName: string;
  locationName: string;
  processSteps?: ProcessStep[];
  processTimeMonths?: string;
  processTimeNote?: string;
  stateSlug?: string;
  citySlug?: string;
  serviceSlug?: string;
}

// Default process steps by treatment type
const DEFAULT_PROCESS_STEPS: Record<string, ProcessStep[]> = {
  "braces": [
    { step: 1, title: "Initial Consultation", description: "Meet with an orthodontist for a comprehensive assessment including X-rays, photos, and digital scans of your teeth.", duration: "45-60 min" },
    { step: 2, title: "Treatment Planning", description: "Your orthodontist creates a customized treatment plan with projected timeline and cost breakdown.", duration: "1-2 days" },
    { step: 3, title: "Braces Application", description: "Brackets are bonded to your teeth and connected with archwires. You'll receive care instructions.", duration: "1-2 hours" },
    { step: 4, title: "Regular Adjustments", description: "Visit every 4-8 weeks for wire changes and adjustments to gradually move teeth.", duration: "20-30 min" },
    { step: 5, title: "Debonding & Retainers", description: "Braces removed, teeth cleaned, and retainers fitted to maintain your new smile.", duration: "1-2 hours" },
  ],
  "invisalign": [
    { step: 1, title: "Consultation & Scanning", description: "3D digital scan of your teeth using iTero or similar scanner to create your custom aligners.", duration: "30-45 min" },
    { step: 2, title: "Treatment Preview", description: "View your projected treatment outcome and aligner sequence before starting.", duration: "Same day" },
    { step: 3, title: "Aligner Fabrication", description: "Your custom aligners are manufactured and shipped to your clinic.", duration: "2-3 weeks" },
    { step: 4, title: "Wear Aligners", description: "Wear each set of aligners 20-22 hours daily, changing every 1-2 weeks as directed.", duration: "12-24 months" },
    { step: 5, title: "Refinement & Retainers", description: "Final refinements if needed, then retainers fitted to maintain your new smile.", duration: "1-2 weeks" },
  ],
  "dental-implants": [
    { step: 1, title: "Assessment & Planning", description: "CT scan and comprehensive exam to determine bone density and implant placement strategy.", duration: "60-90 min" },
    { step: 2, title: "Tooth Extraction", description: "If needed, remove damaged tooth and allow healing before implant placement.", duration: "1-2 hours" },
    { step: 3, title: "Implant Surgery", description: "Titanium implant placed into jawbone under local anesthesia or sedation.", duration: "1-2 hours" },
    { step: 4, title: "Healing & Osseointegration", description: "Bone fuses with implant over 3-6 months. Temporary restoration may be provided.", duration: "3-6 months" },
    { step: 5, title: "Abutment & Crown", description: "Abutment attached, impressions taken, and final crown placed for functional restoration.", duration: "2-3 weeks" },
  ],
  "teeth-whitening": [
    { step: 1, title: "Consultation", description: "Assess teeth and gums to ensure you're a good candidate for whitening.", duration: "30 min" },
    { step: 2, title: "Professional Cleaning", description: "Remove plaque and tartar for even whitening results.", duration: "30-60 min" },
    { step: 3, title: "Whitening Treatment", description: "Apply professional whitening gel, activated by LED light for accelerated results.", duration: "60-90 min" },
    { step: 4, title: "Results & Aftercare", description: "See immediate results, receive aftercare instructions to maintain whiteness.", duration: "15 min" },
  ],
  "root-canal-treatment": [
    { step: 1, title: "Diagnosis & X-Ray", description: "Confirm infection through X-ray and test tooth vitality.", duration: "30 min" },
    { step: 2, title: "Local Anesthesia", description: "Numb the area completely for comfortable treatment.", duration: "10 min" },
    { step: 3, title: "Pulp Removal & Cleaning", description: "Remove infected pulp, clean and shape root canals.", duration: "60-90 min" },
    { step: 4, title: "Filling & Sealing", description: "Fill canals with gutta-percha and seal tooth.", duration: "30-45 min" },
    { step: 5, title: "Crown Placement", description: "Place crown to protect and restore tooth function.", duration: "2-3 weeks" },
  ],
  "veneers": [
    { step: 1, title: "Consultation & Design", description: "Discuss goals, examine teeth, and design your perfect smile.", duration: "45-60 min" },
    { step: 2, title: "Tooth Preparation", description: "Remove thin layer of enamel for veneer placement.", duration: "30-60 min" },
    { step: 3, title: "Impressions & Temporaries", description: "Take impressions, place temporary veneers.", duration: "30 min" },
    { step: 4, title: "Lab Fabrication", description: "Custom veneers created in dental lab (1-2 weeks).", duration: "1-2 weeks" },
    { step: 5, title: "Final Placement", description: "Bond permanent veneers, make final adjustments.", duration: "60-90 min" },
  ],
  "tooth-extraction": [
    { step: 1, title: "Assessment", description: "X-ray to evaluate tooth position and root structure.", duration: "15 min" },
    { step: 2, title: "Anesthesia", description: "Local anesthetic or sedation for comfortable extraction.", duration: "10-15 min" },
    { step: 3, title: "Extraction", description: "Carefully remove tooth using appropriate technique.", duration: "15-45 min" },
    { step: 4, title: "Post-Extraction Care", description: "Control bleeding, apply stitches if needed, review aftercare.", duration: "15-20 min" },
  ],
  "dental-crowns": [
    { step: 1, title: "Assessment", description: "Evaluate tooth, discuss crown options (material, type).", duration: "30 min" },
    { step: 2, title: "Tooth Preparation", description: "Reduce tooth size, shape for crown placement.", duration: "30-60 min" },
    { step: 3, title: "Impressions & Temporary", description: "Take digital/physical impressions, place temporary crown.", duration: "30 min" },
    { step: 4, title: "Lab Fabrication", description: "Custom crown created in lab (1-2 weeks).", duration: "1-2 weeks" },
    { step: 5, title: "Final Placement", description: "Remove temporary, bond permanent crown, check bite.", duration: "30-45 min" },
  ],
};

export const TreatmentProcessSteps = ({
  treatmentName,
  locationName,
  processSteps,
  processTimeMonths,
  processTimeNote,
  stateSlug,
  citySlug,
  serviceSlug,
}: TreatmentProcessStepsProps) => {
  const steps = processSteps || DEFAULT_PROCESS_STEPS[serviceSlug || ""] || [];
  const duration = processTimeMonths || (serviceSlug === "braces" || serviceSlug === "invisalign" ? "12-24 months" : "1-2 weeks");
  
  // Generate HowTo schema for structured data
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${treatmentName} Process in ${locationName}`,
    description: `Step-by-step guide to getting ${treatmentName.toLowerCase()} treatment in ${locationName}`,
    totalTime: processTimeMonths || "P3M", // Approximate duration
    step: steps.map((s) => ({
      "@type": "HowToStep",
      name: s.title,
      text: s.description,
      ...(s.duration && { 
        "estimatedTime": `PT${parseDurationToMinutes(s.duration)}M` 
      }),
    })),
  };

  return (
    <>
      {/* JSON-LD for HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg shadow-blue-500/5"
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-border bg-gradient-to-r from-blue-500/10 via-primary/5 to-teal-500/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">
                How {treatmentName} Works
              </h3>
              <p className="text-sm text-muted-foreground">
                Step-by-step treatment process
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Total Duration: {duration}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">{steps.length} Steps</span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 md:p-5">
          <div className="space-y-0">
            {steps.map((step, idx) => (
              <motion.div 
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                {/* Timeline connector */}
                {idx < steps.length - 1 && (
                  <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-primary to-muted" />
                )}
                
                <div className="flex gap-4 pb-6 last:pb-0">
                  {/* Step icon */}
                  <div className="relative z-10 flex-shrink-0">
                    {(() => {
                      const IconComponent = getStepIcon(step.title);
                      return (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          idx === 0 
                            ? "bg-primary text-white" 
                            : idx === steps.length - 1
                            ? "bg-green-500 text-white"
                            : "bg-primary/10 text-primary"
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-foreground">{step.title}</h4>
                      {step.duration && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {step.duration}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Ready to start your {treatmentName.toLowerCase()} journey?
              </p>
              <div className="flex gap-2">
                <Link 
                  href={`/${stateSlug || 'dubai'}/${citySlug || 'al-nahda'}/${serviceSlug || 'braces'}/`}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Book Free Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Helper function to parse duration string to minutes for schema
function parseDurationToMinutes(duration: string): number {
  const hourMatch = duration.match(/(\d+)\s*hours?/i);
  const minMatch = duration.match(/(\d+)\s*min/i);
  const dayMatch = duration.match(/(\d+)\s*days?/i);
  const weekMatch = duration.match(/(\d+)\s*weeks?/i);
  const monthMatch = duration.match(/(\d+)\s*months?/i);
  
  let minutes = 0;
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);
  if (dayMatch) minutes += parseInt(dayMatch[1]) * 24 * 60;
  if (weekMatch) minutes += parseInt(weekMatch[1]) * 7 * 24 * 60;
  if (monthMatch) minutes += parseInt(monthMatch[1]) * 30 * 24 * 60;
  
  return minutes || 30; // Default 30 min if can't parse
}

export default TreatmentProcessSteps;