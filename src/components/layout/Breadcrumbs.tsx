'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const allItems = showHome ? [{ label: 'Home', href: '/' }, ...items] : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;

        return (
          <div key={item.href || item.label} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-[#62626B]" />
            )}
            {isLast || !item.href ? (
              <span
                className={cn(
                  'text-sm',
                  isLast ? 'text-white font-medium' : 'text-[#62626B]'
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-[#62626B] hover:text-[#2D9C84] transition-all duration-300 text-sm"
              >
                {index === 0 && showHome ? (
                  <Home className="h-3.5 w-3.5 inline-block mr-1" />
                ) : null}
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
