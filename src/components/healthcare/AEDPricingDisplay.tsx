/**
 * AEDPricingDisplay - Displays treatment pricing in AED with cost ranges.
 * 
 * Shows dental service costs in a transparent, patient-friendly format
 * with insurance acceptance indicators.
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Banknote, Info, ShieldCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// UAE dental pricing benchmarks (AED)
const PRICE_RANGES: Record<string, { min: number; max: number; category: string }> = {
  'teeth-cleaning': { min: 150, max: 400, category: 'Preventive' },
  'teeth-whitening': { min: 800, max: 2500, category: 'Cosmetic' },
  'dental-implants': { min: 5000, max: 15000, category: 'Restorative' },
  'root-canal-treatment': { min: 1500, max: 4000, category: 'Endodontics' },
  'dental-veneers': { min: 1500, max: 4000, category: 'Cosmetic' },
  'braces': { min: 5000, max: 20000, category: 'Orthodontics' },
  'invisalign': { min: 8000, max: 25000, category: 'Orthodontics' },
  'dental-crowns': { min: 1000, max: 3500, category: 'Restorative' },
  'dental-bridges': { min: 2000, max: 6000, category: 'Restorative' },
  'wisdom-teeth-removal': { min: 800, max: 3000, category: 'Oral Surgery' },
  'dental-fillings': { min: 200, max: 800, category: 'Restorative' },
  'gum-treatment': { min: 500, max: 3000, category: 'Periodontics' },
  'dental-checkup': { min: 100, max: 300, category: 'Preventive' },
  'emergency-dental-care': { min: 200, max: 1500, category: 'Emergency' },
  'pediatric-dentistry': { min: 150, max: 500, category: 'Pediatric' },
  'dentures': { min: 2000, max: 8000, category: 'Restorative' },
  'cosmetic-dentistry': { min: 1000, max: 5000, category: 'Cosmetic' },
  'smile-makeover': { min: 5000, max: 30000, category: 'Cosmetic' },
  'dental-x-ray': { min: 50, max: 200, category: 'Diagnostic' },
  'fluoride-treatment': { min: 100, max: 300, category: 'Preventive' },
};

function formatAED(amount: number): string {
  return `${amount.toLocaleString()} AED`;
}

interface PricingItem {
  name: string;
  slug: string;
  priceAed?: number | null;
}

interface AEDPricingDisplayProps {
  treatments: PricingItem[];
  hasInsurance?: boolean;
  className?: string;
  compact?: boolean;
}

export function AEDPricingDisplay({
  treatments,
  hasInsurance = false,
  className,
  compact = false,
}: AEDPricingDisplayProps) {
  if (!treatments || treatments.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          Treatment Pricing (AED)
        </h3>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            Prices are indicative ranges based on UAE market averages. Actual costs may vary by clinic and treatment complexity.
          </TooltipContent>
        </Tooltip>
      </div>

      {hasInsurance && (
        <div className="flex items-center gap-2 text-xs text-teal bg-teal/5 border border-teal/20 rounded-lg px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="font-medium">Insurance accepted — check coverage at booking</span>
        </div>
      )}

      <div className={cn(
        'grid gap-2',
        compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
      )}>
        {treatments.slice(0, compact ? 5 : 12).map((treatment) => {
          const benchmark = PRICE_RANGES[treatment.slug];
          const displayPrice = treatment.priceAed
            ? formatAED(treatment.priceAed)
            : benchmark
              ? `${formatAED(benchmark.min)} – ${formatAED(benchmark.max)}`
              : null;

          return (
            <div
              key={treatment.slug}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/20 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{treatment.name}</p>
                {benchmark && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5 font-normal">
                    {benchmark.category}
                  </Badge>
                )}
              </div>
              {displayPrice && (
                <span className="text-sm font-bold text-primary whitespace-nowrap ml-3">
                  {displayPrice}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {treatments.length > (compact ? 5 : 12) && (
        <p className="text-xs text-muted-foreground text-center">
          + {treatments.length - (compact ? 5 : 12)} more services available
        </p>
      )}
    </div>
  );
}

export default AEDPricingDisplay;
