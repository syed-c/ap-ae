'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  highlight?: string;
  action?: {
    label: string;
    href: string;
  };
  align?: 'center' | 'left';
  className?: string;
}

export function SectionHeader({
  label,
  title,
  description,
  highlight,
  action,
  align = 'left',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col',
      align === 'center' ? 'items-center text-center' : 'items-start',
      className,
    )}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2D9C84] mb-3">
          {label}
        </span>
      )}
      <div className={cn(
        'flex flex-col',
        align === 'center' ? 'items-center' : 'items-start',
        action ? 'lg:flex-row lg:items-end lg:justify-between w-full' : '',
      )}>
        <div>
          <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            {title}{highlight ? <span className="text-[#2D9C84]"> {highlight}</span> : null}
          </h2>
          {description && (
            <p className="mt-3 text-[#62626B] text-base md:text-lg max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="hidden lg:inline-flex items-center gap-2 text-sm text-[#2D9C84] hover:text-[#3AB89E] font-medium transition-all duration-300 mt-4 lg:mt-0 shrink-0"
          >
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
