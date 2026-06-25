'use client'

/**
 * Animated KPI Card with Circular Progress
 * Premium dashboard card with animations and visual effects
 */

import { useState, useEffect, ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AnimatedKPICardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  variant?: 'default' | 'circular' | 'gradient' | 'dark';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  maxValue?: number; // For circular progress
  suffix?: string;
  onClick?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  delay?: number; // Animation delay in ms
}

export function AnimatedKPICard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  variant = 'default',
  trend,
  trendValue,
  maxValue = 100,
  suffix,
  onClick,
  action,
  className,
  delay = 0,
}: AnimatedKPICardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  // Animate number counting up
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      
      const duration = 1000;
      const steps = 30;
      const increment = numericValue / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [numericValue, delay]);

  // Calculate percentage for circular progress
  const percentage = Math.min((numericValue / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  if (variant === 'circular') {
    return (
      <div
        className={cn(
          'relative group rounded-[12px] border border-border bg-card p-5 shadow-[0_2px_8px_rgba(17,27,33,0.08)] transition-all duration-300',
          'hover:-translate-y-0.5 cursor-pointer overflow-hidden',
          className
        )}
        onClick={onClick}
      >
        {/* Background glow */}
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/8 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
        
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative h-20 w-20 flex-shrink-0">
            <svg className="h-20 w-20 -rotate-90 transform">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted/30"
              />
              {/* Progress circle with animation */}
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={isAnimating ? strokeDashoffset : circumference}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center value */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">
                {typeof value === 'string' ? value : displayValue}
                {suffix}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-1">
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : null}
                <span className={cn(
                  'text-xs font-medium',
                  trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  {trendValue}
                </span>
              </div>
            )}
            {action && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-xs text-secondary hover:bg-accent hover:text-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
              >
                {action.label}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'dark' || variant === 'gradient') {
    return (
      <div
        className={cn(
          'relative group overflow-hidden rounded-[12px] border border-border p-5 transition-all duration-300',
          'hover:-translate-y-0.5 cursor-pointer',
          variant === 'dark' 
            ? 'bg-secondary text-white shadow-[0_4px_16px_rgba(7,94,84,0.18)]' 
            : 'bg-primary/10 text-foreground shadow-[0_0_30px_-8px_oklch(0.72_0.19_28/0.25)]',
          className
        )}
        onClick={onClick}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -bottom-5 -left-5 w-16 h-16 bg-white/5 rounded-full blur-xl" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              variant === 'dark' ? 'bg-white/10' : 'bg-white/50'
            )}>
              <Icon className={cn('h-5 w-5', variant === 'dark' ? 'text-white' : 'text-secondary')} />
            </div>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                variant === 'dark' ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/60'
              )}>
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {trendValue && <span>{trendValue}</span>}
              </div>
            )}
          </div>

          <p className={cn(
            'text-3xl font-bold tracking-tight transition-all duration-1000',
            isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          )}>
            {typeof value === 'string' ? value : displayValue}
            {suffix}
          </p>
          <p className={cn('mt-1 text-sm', variant === 'dark' ? 'text-foreground/70' : 'text-muted-foreground')}>{label}</p>

          {action && (
            <Button
              variant="ghost"
              size="sm"
              className={cn('mt-3 h-7 px-0 text-xs hover:bg-transparent', variant === 'dark' ? 'text-white/80 hover:text-white' : 'text-secondary hover:text-secondary')}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
            >
              {action.label}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
      <div
        className={cn(
          'relative group rounded-[12px] border border-border bg-card p-4 shadow-[0_2px_8px_rgba(17,27,33,0.08)] transition-all duration-300',
          'hover:-translate-y-0.5 cursor-pointer',
          className
        )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={cn(
            'text-xl font-bold text-foreground transition-all duration-700',
            isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
          )}>
            {typeof value === 'string' ? value : displayValue}
            {suffix}
          </p>
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnimatedKPICard;
