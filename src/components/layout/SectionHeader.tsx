'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  badge?: string;
  label?: string;
  title: string;
  highlight?: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
  children?: ReactNode;
  center?: boolean;
}

export function SectionHeader({
  badge,
  label,
  title,
  highlight,
  description,
  action,
  className,
  children,
  center = false,
}: SectionHeaderProps) {
  const badgeText = badge || label;
  return (
    <div className={cn('flex flex-col gap-4', center ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between', className)}>
      <div className={cn(center ? 'max-w-2xl mx-auto' : 'max-w-2xl')}>
        {badgeText && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary mb-3 block">
            {badgeText}
          </span>
        )}
        <h2 className="text-foreground text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          {title}{highlight ? <span className="text-primary"> {highlight}</span> : null}
        </h2>
        {description && (
          <p className={cn('mt-3 text-muted leading-relaxed', center ? 'max-w-2xl' : 'max-w-xl')}>
            {description}
          </p>
        )}
        {children}
      </div>
      {action && !center && (
        <Link
          href={action.href}
          className="hidden lg:inline-flex items-center gap-2 text-sm text-primary hover:text-[#0F766E] font-medium transition-all duration-300 mt-4 lg:mt-0 shrink-0"
        >
          {action.label}
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      )}
    </div>
  );
}
