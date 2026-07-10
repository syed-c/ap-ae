'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  variant?: 'default' | 'muted' | 'dark' | 'gradient' | 'primary';
  className?: string;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  center?: boolean;
}

const paddings = {
  sm: 'py-10 md:py-14',
  md: 'py-14 md:py-16 lg:py-20',
  lg: 'py-16 md:py-20 lg:py-24',
};

export function Section({ children, variant = 'default', className, id, size = 'lg', center = false }: SectionProps) {
  const variants = {
    default: 'bg-white',
    muted: 'bg-[#F9FAFB]',
    dark: 'bg-[#FAFAFA]',
    gradient: 'bg-gradient-to-b from-[#F9FAFB] to-white',
    primary: 'bg-primary text-white',
  };

  return (
    <section id={id} className={cn(variants[variant], paddings[size], className)}>
      <div className={cn('max-w-[1440px] mx-auto px-4 lg:px-6', center && 'text-center')}>
        {center ? <div className="max-w-3xl mx-auto">{children}</div> : children}
      </div>
    </section>
  );
}
