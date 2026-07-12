'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
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

interface ActionItem {
  href: string;
  label: string;
  variant?: 'default' | 'outline';
  icon?: ReactNode;
}

interface MarketplaceHeroProps {
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  title: string;
  highlight?: string;
  description?: string;
  actions?: ReactNode | ActionItem[];
  showSearch?: boolean;
  stats?: StatItem[];
  children?: ReactNode;
  className?: string;
  align?: 'left' | 'center';
}

const DEFAULT_STATS: StatItem[] = [
  { value: '500+', label: 'Dentists' },
  { value: '200+', label: 'Clinics' },
  { value: '50+', label: 'Treatments' },
  { value: '7', label: 'Emirates' },
];

export function MarketplaceHero({
  breadcrumbs,
  badge,
  title,
  highlight,
  description,
  actions,
  showSearch = true,
  stats,
  children,
  className,
  align = 'left',
}: MarketplaceHeroProps) {
  const displayStats = stats || DEFAULT_STATS;
  const isCentered = align === 'center';

  return (
    <section className={cn('relative overflow-hidden gradient-hero', className)}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-border/70" />
        <div className="absolute left-1/2 top-12 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
      </div>

      <div className={cn(
        'relative max-w-[1440px] mx-auto px-4 lg:px-6 py-14 lg:py-20 xl:py-24',
        isCentered && 'text-center'
      )}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cn(isCentered && 'flex justify-center')}
          >
            <Breadcrumbs items={breadcrumbs} />
          </motion.div>
        )}

        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={cn('mt-4', isCentered && 'flex justify-center')}
          >
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {badge}
            </span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={cn(
            'mt-6 text-foreground text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.02]',
            isCentered ? 'mx-auto max-w-4xl' : 'max-w-4xl'
          )}
        >
          {highlight ? (
            <>
              {title}{' '}
              <span className="text-gradient">
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
            className={cn(
              'mt-4 text-muted text-base md:text-lg max-w-2xl leading-relaxed',
              isCentered && 'mx-auto'
            )}
          >
            {description}
          </motion.p>
        )}

        {actions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={cn('mt-6 flex flex-wrap gap-3', isCentered && 'justify-center')}
          >
            {Array.isArray(actions)
              ? (actions as ActionItem[]).map((a, i) => (
                  <Button key={i} variant={a.variant || 'default'} asChild>
                    <Link href={a.href} className="inline-flex items-center gap-2">{a.icon}{a.label}</Link>
                  </Button>
                ))
              : actions}
          </motion.div>
        )}

        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className={cn('mt-8', isCentered && 'mx-auto max-w-4xl')}
          >
            <SearchBox variant="hero" />
          </motion.div>
        )}

        {displayStats && displayStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={cn(
              'mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4',
              isCentered && 'mx-auto max-w-5xl'
            )}
          >
            {displayStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/70 bg-background/85 px-4 py-4 text-center shadow-sm"
              >
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={cn('mt-8', isCentered && 'mx-auto max-w-4xl')}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
