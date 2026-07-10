'use client';

import { ReactNode } from 'react';
import { Star, BadgeCheck, Users } from 'lucide-react';

interface PageHeroProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  badge?: string;
  highlight?: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  size?: string;
  showTrust?: boolean;
}

export function PageHero({
  kicker, badge, title, subtitle, description, highlight,
  children, showTrust = true,
}: PageHeroProps) {
  const displayKicker = kicker || badge;
  const displaySubtitle = subtitle || description;
  const displayTitle = highlight ? `${title} ${highlight}` : title;

  return (
    <section className="gradient-dark-hero overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10 py-14 lg:py-20">
        {displayKicker && (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 mb-3 text-center">
            {displayKicker}
          </p>
        )}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white leading-[1.1]">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-zinc-400 text-sm md:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
              {displaySubtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
        {showTrust && (
          <div className="mt-8 pt-6 border-t border-white/5 max-w-lg mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> 4.8 <span className="text-amber-300/50">★</span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> 1,286 clinics
              </span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Users className="h-3.5 w-3.5" /> 200k+ patients
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
