'use client';
import { motion } from "framer-motion";
import { 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

interface Candidate {
  description: string;
  is_suitable: boolean;
  conditions?: string[];
}

interface CandidateSectionProps {
  treatmentName: string;
  locationName: string;
  candidates?: Candidate[];
  alternatives?: { name: string; slug: string; reason: string }[];
  stateSlug?: string;
  citySlug?: string;
}

// Default candidates by treatment type
const DEFAULT_CANDIDATES: Record<string, Candidate[]> = {
  "braces": [
    { 
      description: "Children and teenagers with developing jaws", 
      is_suitable: true,
      conditions: ["Age 10+", "Primary teeth replaced", "Good oral hygiene"]
    },
    { 
      description: "Adults with mild to severe misalignment", 
      is_suitable: true,
      conditions: ["Healthy gums", "Adequate bone density", "Committed to treatment duration"]
    },
    { 
      description: "Patients with bite issues (overbite, underbite, crossbite)", 
      is_suitable: true,
      conditions: ["Moderate to severe case", "Willing to wear rubber bands"]
    },
    { 
      description: "Patients with severe gum disease or bone loss", 
      is_suitable: false,
      conditions: ["Uncontrolled gum disease", "Insufficient bone for tooth movement"]
    },
    { 
      description: "Patients unwilling to commit to long treatment", 
      is_suitable: false,
      conditions: ["Less than 12 months commitment", "Unable to attend regular adjustments"]
    },
  ],
  "invisalign": [
    { 
      description: "Adults and teens seeking discreet treatment", 
      is_suitable: true,
      conditions: ["Age 12+ for teens", "Committed to 22 hours daily wear", "Mild to moderate case"]
    },
    { 
      description: "Professionals and image-conscious patients", 
      is_suitable: true,
      conditions: ["Need to remove for meetings", "Prefer no visible hardware"]
    },
    { 
      description: "Patients with complex orthodontic needs", 
      is_suitable: false,
      conditions: ["Severe rotations", "Significant bite issues", "Complex tooth movements"]
    },
    { 
      description: "Children under 10 years old", 
      is_suitable: false,
      conditions: ["Still have primary teeth", "Jaw still developing significantly"]
    },
    { 
      description: "Patients who frequently forget to wear aligners", 
      is_suitable: false,
      conditions: ["Poor compliance history", "Unable to track wear time"]
    },
  ],
  "dental-implants": [
    { 
      description: "Adults with one or more missing teeth", 
      is_suitable: true,
      conditions: ["Age 18+", "Healthy gums", "Adequate bone (or can have graft)"]
    },
    { 
      description: "Patients seeking permanent tooth replacement", 
      is_suitable: true,
      conditions: ["Want fixed solution", "Not suitable for dentures"]
    },
    { 
      description: "Non-smokers or those willing to quit", 
      is_suitable: true,
      conditions: ["Can stop smoking 2 weeks before/after", "No heavy smoking"]
    },
    { 
      description: "Patients with uncontrolled diabetes", 
      is_suitable: false,
      conditions: ["Poorly controlled blood sugar", "Healing compromised"]
    },
    { 
      description: "Heavy teeth grinders (bruxism)", 
      is_suitable: false,
      conditions: ["Without bite guard", "Can damage implant crown"]
    },
  ],
  "teeth-whitening": [
    { 
      description: "Adults with natural healthy teeth", 
      is_suitable: true,
      conditions: ["No crowns or veneers on front teeth", "No sensitive teeth", "Good oral health"]
    },
    { 
      description: "Patients with surface stains (coffee, smoking, aging)", 
      is_suitable: true,
      conditions: ["Extrinsic staining", "Non-smoker or willing to reduce"]
    },
    { 
      description: "Patients with crowns or veneers", 
      is_suitable: false,
      conditions: ["Crowns won't whiten", "Would need replacement after whitening"]
    },
    { 
      description: "Pregnant or breastfeeding women", 
      is_suitable: false,
      conditions: ["Safety not established", "Wait until after weaning"]
    },
    { 
      description: "Those with sensitive teeth", 
      is_suitable: false,
      conditions: ["Enamel erosion", "Exposed roots", "Existing sensitivity"]
    },
  ],
  "root-canal-treatment": [
    { 
      description: "Patients with infected or inflamed tooth pulp", 
      is_suitable: true,
      conditions: ["Persistent pain", "Sensitivity to hot/cold", "Swelling or abscess"]
    },
    { 
      description: "Teeth with deep decay reaching pulp", 
      is_suitable: true,
      conditions: ["Decay visible on X-ray", "Pulp exposed or nearly exposed"]
    },
    { 
      description: "Teeth with failed previous root canal", 
      is_suitable: true,
      conditions: ["Retreatment possible", "Or apicoectomy needed"]
    },
    { 
      description: "Teeth with vertical root fracture", 
      is_suitable: false,
      conditions: ["Cannot be saved", "Extraction required"]
    },
    { 
      description: "Teeth with severe bone loss around roots", 
      is_suitable: false,
      conditions: ["Poor prognosis", "Extraction and implant better option"]
    },
  ],
  "dental-crowns": [
    { 
      description: "Teeth with large fillings or decay", 
      is_suitable: true,
      conditions: ["More filling than tooth", "Structural weakness"]
    },
    { 
      description: "Root-treated teeth needing protection", 
      is_suitable: true,
      conditions: ["After root canal", "High risk of fracture"]
    },
    { 
      description: "Cracked or broken teeth", 
      is_suitable: true,
      conditions: ["Vertical crack not extending below gum"]
    },
    { 
      description: "Teeth with insufficient structure", 
      is_suitable: false,
      conditions: ["Too much tooth missing", "Root damage"]
    },
    { 
      description: "Patients with severe gum disease", 
      is_suitable: false,
      conditions: ["Crown would trap bacteria", "Gum treatment needed first"]
    },
  ],
  "veneers": [
    { 
      description: "Patients wanting cosmetic smile improvement", 
      is_suitable: true,
      conditions: ["Healthy teeth and gums", "Realistic expectations"]
    },
    { 
      description: "Teeth with intrinsic stains (not respond to whitening)", 
      is_suitable: true,
      conditions: ["Fluorosis", "Tetracycline staining", "Old root canal staining"]
    },
    { 
      description: "Minor gaps and spacing issues", 
      is_suitable: true,
      conditions: ["Small gaps", "Orthodontic alternative available"]
    },
    { 
      description: "Teeth with insufficient enamel", 
      is_suitable: false,
      conditions: ["Bonding weak", "Crowns better option"]
    },
    { 
      description: "Patients with heavy bite or bruxism", 
      is_suitable: false,
      conditions: ["Will chip or break veneers", "Night guard required if done"]
    },
  ],
  "tooth-extraction": [
    { 
      description: "Teeth with severe decay beyond repair", 
      is_suitable: true,
      conditions: ["Root damage", "Infection too advanced"]
    },
    { 
      description: "Impacted wisdom teeth causing problems", 
      is_suitable: true,
      conditions: ["Pain", "Infection", "Crowding", "Cyst formation"]
    },
    { 
      description: "Teeth with severe gum disease", 
      is_suitable: true,
      conditions: ["Loose teeth", "Bone loss", "Not restorable"]
    },
    { 
      description: "Teeth that can be saved with treatment", 
      is_suitable: false,
      conditions: ["Root canal possible", "Crown possible", "Gum disease manageable"]
    },
    { 
      description: "Healthy, restorable teeth", 
      is_suitable: false,
      conditions: ["No need for extraction", "Better to preserve"]
    },
  ],
};

export const CandidateSection = ({
  treatmentName,
  locationName,
  candidates,
  alternatives,
  stateSlug,
}: CandidateSectionProps) => {
  const displayCandidates = candidates || DEFAULT_CANDIDATES[stateSlug || ""] || [];
  
  const suitable = displayCandidates.filter(c => c.is_suitable);
  const notSuitable = displayCandidates.filter(c => !c.is_suitable);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg shadow-purple-500/5"
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-border bg-gradient-to-r from-purple-500/10 via-primary/5 to-teal-500/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Is {treatmentName} Right for You?
            </h3>
            <p className="text-sm text-muted-foreground">
              Find out if you're a good candidate
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 space-y-6">
        {/* Good Candidates */}
        <div>
          <h4 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Good Candidates
          </h4>
          <div className="space-y-3">
            {suitable.map((candidate, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
              >
                <p className="text-sm text-foreground font-medium">{candidate.description}</p>
                {candidate.conditions && Array.isArray(candidate.conditions) && candidate.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {candidate.conditions.map((condition, cidx) => (
                      <span 
                        key={cidx} 
                        className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Not Suitable */}
        <div>
          <h4 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            May Not Be Suitable
          </h4>
          <div className="space-y-3">
            {notSuitable.map((candidate, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (suitable.length + idx) * 0.05 }}
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
              >
                <p className="text-sm text-foreground font-medium">{candidate.description}</p>
                {candidate.conditions && Array.isArray(candidate.conditions) && candidate.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {candidate.conditions.map((condition, cidx) => (
                      <span 
                        key={cidx} 
                        className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Alternative Options */}
        {alternatives && alternatives.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Alternative Options
            </h4>
            <div className="flex flex-wrap gap-2">
              {alternatives.map((alt, idx) => (
                <Link
                  key={idx}
                  href={`/${stateSlug || 'dubai'}/${alt.slug}/`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm"
                >
                  <span className="font-medium text-foreground">{alt.name}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Not sure? Book a consultation to discuss your options.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This is general guidance. A consultation with a dentist is the best way to determine if {treatmentName.toLowerCase()} is right for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CandidateSection;