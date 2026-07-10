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
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      <Link
        href="/"
        className="flex items-center gap-1 text-muted hover:text-primary transition-all duration-300 text-sm"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-muted hover:text-primary transition-all duration-300 text-sm"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground text-sm font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
