'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionVariant = 'default' | 'muted' | 'dark' | 'gradient' | 'primary';
type SectionSize = 'sm' | 'md' | 'lg' | 'xl';

interface SectionProps {
  children: ReactNode;
  variant?: SectionVariant;
  size?: SectionSize;
  className?: string;
  id?: string;
  containerClassName?: string;
  ambient?: 'teal' | 'gold' | 'none';
}

const variantStyles: Record<SectionVariant, string> = {
  default: 'bg-[#0A0A0A]',
  muted: 'bg-[#101010]',
  dark: 'bg-[#161616]',
  gradient: 'bg-gradient-to-b from-[#101010] to-[#0A0A0A]',
  primary: 'bg-[rgba(45,156,132,0.05)]',
};

const sizeStyles: Record<SectionSize, string> = {
  sm: 'py-10',
  md: 'py-14',
  lg: 'py-16',
  xl: 'py-20',
};

export function Section({
  children,
  variant = 'default',
  size = 'md',
  className,
  id,
  containerClassName,
  ambient = 'none',
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        'w-full relative overflow-hidden',
        ambient === 'teal' && 'ambient-teal',
        ambient === 'gold' && 'ambient-gold',
        className,
      )}
    >
      <div className={cn('relative z-10 max-w-[1440px] mx-auto px-4 lg:px-6', containerClassName)}>
        {children}
      </div>
    </section>
  );
}
