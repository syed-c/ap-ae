/**
 * CredentialsBadge - Displays dentist qualifications and credentials
 * in a professional, trust-building format.
 */

import { GraduationCap, Award, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CredentialsBadgeProps {
  qualifications?: string[] | null;
  specializations?: string[] | null;
  yearsExperience?: number | null;
  languages?: string[] | null;
  className?: string;
}

export function CredentialsBadge({
  qualifications,
  specializations,
  yearsExperience,
  languages,
  className,
}: CredentialsBadgeProps) {
  const hasContent = (qualifications && qualifications.length > 0) || 
    (specializations && specializations.length > 0) ||
    yearsExperience;

  if (!hasContent) return null;

  return (
    <div className={cn('card-modern p-5 space-y-4', className)}>
      <h3 className="font-display text-base font-bold flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-primary" />
        Credentials & Qualifications
      </h3>

      {/* Experience highlight */}
      {yearsExperience && yearsExperience > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">{yearsExperience}+ Years of Practice</p>
            <p className="text-xs text-muted-foreground">Licensed dental professional</p>
          </div>
        </div>
      )}

      {/* Qualifications */}
      {qualifications && qualifications.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Qualifications</p>
          <div className="flex flex-wrap gap-2">
            {qualifications.map((q, i) => (
              <Badge
                key={i}
                variant="outline"
                className="rounded-lg px-3 py-1.5 font-medium text-xs bg-background"
              >
                <Award className="h-3 w-3 mr-1.5 text-primary" />
                {q}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Specializations */}
      {specializations && specializations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Specializations</p>
          <div className="flex flex-wrap gap-2">
            {specializations.map((s, i) => (
              <Badge
                key={i}
                className="rounded-lg px-3 py-1.5 font-medium text-xs bg-teal/10 text-teal border-teal/20"
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Languages</p>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((lang, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs"
              >
                {lang}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CredentialsBadge;
