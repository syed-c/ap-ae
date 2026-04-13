'use client';
import { motion } from "framer-motion";
import { 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Smile,
  Heart,
  Shield,
  Star,
  Users,
  Award,
  Lightbulb
} from "lucide-react";

interface Benefit {
  title: string;
  description: string;
  icon?: string;
  category?: string;
}

interface TreatmentBenefitsProps {
  treatmentName: string;
  locationName: string;
  benefits?: Benefit[];
  stateSlug?: string;
  citySlug?: string;
  serviceSlug?: string;
}

// Default benefits by treatment type
const DEFAULT_BENEFITS: Record<string, Benefit[]> = {
  "braces": [
    { title: "Straighter Teeth", description: "Achieve a beautifully aligned smile that boosts confidence and self-esteem.", icon: "Smile" },
    { title: "Improved Oral Health", description: "Properly aligned teeth are easier to clean, reducing risk of cavities and gum disease.", icon: "Heart" },
    { title: "Better Bite Function", description: "Correct bite issues improve chewing, speech, and jaw comfort.", icon: "TrendingUp" },
    { title: "Long-Lasting Results", description: "With proper retainers, results can last a lifetime.", icon: "Award" },
    { title: "Enhanced Facial Structure", description: "Proper alignment can improve jaw position and facial aesthetics.", icon: "Shield" },
    { title: "Professional Appearance", description: "Modern braces options are more discreet than ever.", icon: "Star" },
  ],
  "invisalign": [
    { title: "Virtually Invisible", description: "Clear aligners are barely noticeable, perfect for professionals and image-conscious adults.", icon: "Smile" },
    { title: "Removable Convenience", description: "Take out for eating, drinking, and special occasions.", icon: "CheckCircle2" },
    { title: "Easy Oral Hygiene", description: "Brush and floss normally without navigating around brackets.", icon: "Heart" },
    { title: "Fewer Office Visits", description: "Change aligners at home, reducing clinic visits.", icon: "Users" },
    { title: "Predictable Results", description: "Digital planning shows your expected outcome before starting.", icon: "Lightbulb" },
    { title: "Comfortable Fit", description: "No metal wires or brackets to cause mouth irritation.", icon: "Shield" },
  ],
  "dental-implants": [
    { title: "Natural Appearance", description: "Implants look and feel like your natural teeth.", icon: "Smile" },
    { title: "Preserve Jaw Bone", description: "Stimulates bone growth, preventing bone loss.", icon: "Heart" },
    { title: "Durable Solution", description: "With proper care, implants can last 20+ years or lifetime.", icon: "Award" },
    { title: "Maintain Healthy Teeth", description: "No need to grind adjacent teeth like with bridges.", icon: "Shield" },
    { title: "Eat Whatever You Want", description: "Full chewing power restored for all foods.", icon: "TrendingUp" },
    { title: "Easy Care", description: "Brush and floss just like natural teeth.", icon: "CheckCircle2" },
  ],
  "teeth-whitening": [
    { title: "Instant Results", description: "Professional whitening can lighten teeth several shades in one session.", icon: "Sparkles" },
    { title: "Boosted Confidence", description: "A brighter smile enhances self-esteem and first impressions.", icon: "Smile" },
    { title: "Safe Treatment", description: "Professional supervision ensures safe, controlled whitening.", icon: "Shield" },
    { title: "Youthful Appearance", description: "Whiter teeth are associated with youth and vitality.", icon: "Star" },
    { title: "Customized Treatment", description: "Get the exact shade you want with professional guidance.", icon: "Lightbulb" },
    { title: "Long-Lasting Effects", description: "With proper care, results can last 1-3 years.", icon: "Award" },
  ],
  "root-canal-treatment": [
    { title: "Save Your Natural Tooth", description: "Preserve your original tooth rather than extracting it.", icon: "Heart" },
    { title: "Eliminate Pain", description: "Remove infection and eliminate toothache discomfort.", icon: "Shield" },
    { title: "Restore Function", description: "Return to normal chewing and biting without pain.", icon: "TrendingUp" },
    { title: "Prevent Spread of Infection", description: "Stop infection from spreading to jaw or bloodstream.", icon: "CheckCircle2" },
    { title: "Cost-Effective", description: "Root canal is cheaper than extraction and implant.", icon: "Award" },
    { title: "Natural Appearance", description: "Crown looks and functions like your natural tooth.", icon: "Smile" },
  ],
  "dental-crowns": [
    { title: "Strengthen Damaged Teeth", description: "Protect weak or cracked teeth from further damage.", icon: "Shield" },
    { title: "Natural Look", description: "Modern crowns match your natural tooth color and shape.", icon: "Smile" },
    { title: "Restore Function", description: "Full chewing function restored for comfortable eating.", icon: "TrendingUp" },
    { title: "Long-Lasting", description: "With proper care, crowns can last 10-15 years.", icon: "Award" },
    { title: "Protect After RCT", description: "Prevent fracture of root-treated teeth.", icon: "Heart" },
    { title: "Improve Appearance", description: "Cover stains, misshapen teeth, or large fillings.", icon: "Star" },
  ],
  "veneers": [
    { title: "Instant Smile Transformation", description: "Dramatically improve smile in just 2-3 visits.", icon: "Sparkles" },
    { title: "Stain Resistant", description: "Porcelain veneers resist stains from coffee, tea, and smoking.", icon: "Shield" },
    { title: "Minimal Tooth Removal", description: "Preserve more natural tooth structure than crowns.", icon: "Heart" },
    { title: "Natural Appearance", description: "Light-reflecting properties match natural teeth.", icon: "Smile" },
    { title: "Durable Solution", description: "With proper care, veneers can last 10-15 years.", icon: "Award" },
    { title: "Fix Multiple Issues", description: "Address chips, gaps, discoloration, and misalignment.", icon: "Lightbulb" },
  ],
  "tooth-extraction": [
    { title: "Pain Relief", description: "Eliminate pain from infected or damaged teeth.", icon: "Shield" },
    { title: "Prevent Infection Spread", description: "Remove source of infection to protect surrounding teeth.", icon: "CheckCircle2" },
    { title: "Create Space", description: "Make room for orthodontic treatment or implants.", icon: "TrendingUp" },
    { title: "Quick Recovery", description: "Simple extractions heal within a few days.", icon: "Heart" },
    { title: "Foundation for Replacement", description: "First step toward implants or bridges.", icon: "Award" },
  ],
};

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Smile, Heart, Shield, Star, Award, CheckCircle2, TrendingUp, Sparkles, Lightbulb, Users
};

export const TreatmentBenefits = ({
  treatmentName,
  locationName,
  benefits,
  stateSlug,
  citySlug,
  serviceSlug,
}: TreatmentBenefitsProps) => {
  const displayBenefits = benefits || DEFAULT_BENEFITS[serviceSlug || ""] || [];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg shadow-green-500/5"
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-border bg-gradient-to-r from-green-500/10 via-primary/5 to-teal-500/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Benefits of {treatmentName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Why patients choose {treatmentName.toLowerCase()} treatment
            </p>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayBenefits.map((benefit, idx) => {
            const iconName = benefit.icon;
            const IconComponent = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : CheckCircle2;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <IconComponent className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-3 w-3 text-primary" />
              </div>
              <span>DHA Licensed</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-3 w-3 text-gold" />
              </div>
              <span>4.9+ Rating</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              </div>
              <span>Verified Reviews</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TreatmentBenefits;