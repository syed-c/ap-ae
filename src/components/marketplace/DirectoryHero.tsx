'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Breadcrumbs, BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { SearchBox } from '@/components/SearchBox';

interface StatItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface DirectoryHeroProps {
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  actions?: ReactNode;
  stats?: StatItem[];
  children?: ReactNode;
  className?: string;
}

const DEFAULT_STATS: StatItem[] = [
  { value: '500+', label: 'Dentists' },
  { value: '200+', label: 'Clinics' },
  { value: '50+', label: 'Treatments' },
  { value: '7', label: 'Emirates' },
];

export function DirectoryHero({
  breadcrumbs,
  badge,
  title,
  highlight,
  description,
  actions,
  stats,
  children,
  className,
}: DirectoryHeroProps) {
  const displayStats = stats || DEFAULT_STATS;

  return (
    <section className={cn('relative overflow-hidden', className)}>
      {/* Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[700px] h-[700px] bg-[#2D9C84] opacity-[0.08] rounded-full blur-[140px]" />
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-[#FACC15] opacity-[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-[#2D9C84] opacity-[0.04] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 lg:px-6 py-16 lg:py-24 xl:py-32">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Breadcrumbs items={breadcrumbs} />
          </motion.div>
        )}

        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-4"
          >
            <span className="badge-teal inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2D9C84] bg-[rgba(45,156,132,0.1)] border border-[rgba(45,156,132,0.2)] rounded-full">
              {badge}
            </span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-white text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight"
        >
          {highlight ? (
            <>
              {title}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D9C84] to-[#FACC15]">
                {highlight}
              </span>
            </>
          ) : (
            title
          )}
        </motion.h1>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-4 text-[#62626B] text-lg md:text-xl max-w-2xl leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {actions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            {actions}
          </motion.div>
        )}

        {/* Search always shown for DirectoryHero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-8"
        >
          <SearchBox variant="hero" />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {displayStats.map((stat) => (
            <div
              key={stat.label}
              className="card-glass bg-[rgba(22,22,22,0.6)] backdrop-blur-xl border border-[#1E1E1E] rounded-xl px-5 py-4 text-center"
            >
              {stat.icon && <div className="text-[#2D9C84] mb-2 flex justify-center">{stat.icon}</div>}
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-[#62626B] mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
