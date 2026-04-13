'use client';
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Clock, 
  UserCircle, 
  Stethoscope,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface EatAttributionProps {
  treatmentName: string;
  locationName: string;
  lastReviewedBy?: string;
  lastReviewedDate?: string;
  medicalAccuracyVerified?: boolean;
  expertCredential?: string;
  contentLastUpdated?: string;
}

export const EatAttribution = ({
  treatmentName,
  locationName,
  lastReviewedBy,
  lastReviewedDate,
  medicalAccuracyVerified = false,
  expertCredential,
  contentLastUpdated,
}: EatAttributionProps) => {
  const today = new Date();
  const lastUpdated = lastReviewedDate || contentLastUpdated || today.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-lg"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Section - Attribution */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">
              Content You Can Trust
            </h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
              {lastReviewedBy && (
                <span className="flex items-center gap-1">
                  <UserCircle className="h-3 w-3" />
                  Reviewed by {lastReviewedBy}
                  {expertCredential && <span className="text-primary/80"> ({expertCredential})</span>}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last updated: {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Verification Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {medicalAccuracyVerified ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <span className="text-xs font-semibold text-green-700 dark:text-green-400 block">
                  Medically Verified
                </span>
                <span className="text-xs text-green-600/70">
                  DHA-licensed dentist
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <Stethoscope className="h-4 w-4 text-amber-600" />
              <div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">
                  Information Only
                </span>
                <span className="text-xs text-amber-600/70">
                  Consult a professional
                </span>
              </div>
            </div>
          )}
          
          <Link 
            href="/editorial-policy/"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            Our Editorial Process
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Disclaimer:</strong> This content is for informational purposes only and does not constitute medical advice. 
          Always consult with a qualified dental professional for diagnosis and treatment recommendations. 
          Pricing information is approximate and subject to change. Individual results may vary.
        </p>
      </div>
    </motion.div>
  );
};

export default EatAttribution;