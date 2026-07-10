'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchBox } from '@/components/SearchBox';

interface StatItem {
  label: string;
  value: string;
  icon?: ReactNode;
}

interface DirectoryHeroProps {
  badge?: string;
  title: string;
  highlight: string;
  description: string;
  stats: StatItem[];
  className?: string;
}

export function DirectoryHero({
  badge,
  title,
  highlight,
  description,
  stats,
  className,
}: DirectoryHeroProps) {
  return (
    <section className={cn('relative overflow-hidden gradient-hero', className)}>
      {/* Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[700px] h-[700px] bg-primary opacity-[0.04] rounded-full blur-[140px]" />
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-primary opacity-[0.03] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary opacity-[0.02] rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 lg:px-6 py-16 lg:py-24 xl:py-32">
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <span className="badge-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold">
              {badge}
            </span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-foreground text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight"
        >
          {title}{' '}
          <span className="text-gradient">
            {highlight}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-4 text-muted text-lg md:text-xl max-w-2xl leading-relaxed"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-8"
        >
          <SearchBox variant="hero" />
        </motion.div>

        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/60 backdrop-blur-xl border border-border/60 rounded-xl px-5 py-4 text-center"
              >
                {stat.icon && <div className="text-primary mb-2 flex justify-center">{stat.icon}</div>}
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
