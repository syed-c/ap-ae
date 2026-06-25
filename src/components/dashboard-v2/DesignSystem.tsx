/**
 * AppointPanda Premium Design System v2
 * A collection of reusable components with consistent styling
 */

import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowRight, Loader2 } from 'lucide-react';

// ============================================
// DESIGN TOKENS
// ============================================
export const designTokens = {
  radius: {
    sm: 'rounded-[8px]',
    md: 'rounded-[10px]',
    lg: 'rounded-[12px]',
    xl: 'rounded-[16px]',
    full: 'rounded-full',
  },
  shadow: {
    sm: 'shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
    md: 'shadow-[0_4px_12px_rgba(0,0,0,0.35)]',
    lg: 'shadow-[0_8px_28px_rgba(0,0,0,0.4)]',
    xl: 'shadow-[0_16px_40px_-24px_rgba(0,0,0,0.5)]',
    glow: 'shadow-[0_0_30px_-8px_oklch(0.72_0.19_28/0.35)]',
  },
  transition: 'transition-all duration-200 ease-out',
};

// ============================================
// CARD COMPONENTS
// ============================================
interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'outlined';
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
}

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ children, className, variant = 'default', hover = false, padding = 'md', onClick }, ref) => {
    const baseStyles = 'relative overflow-hidden';

    const variantStyles = {
      default: 'bg-card border border-border shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
      glass: 'bg-card/80 backdrop-blur-xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
      gradient: 'bg-card/50 border border-border',
      elevated: 'bg-card border border-border shadow-[0_4px_16px_rgba(17,27,33,0.12)]',
      outlined: 'bg-transparent border border-border',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hover
      ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(17,27,33,0.12)]'
      : '';

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          baseStyles,
          'rounded-[12px]',
          variantStyles[variant],
          paddingStyles[padding],
          hoverStyles,
          designTokens.transition,
          className
        )}
      >
        {children}
      </div>
    );
  }
);
PremiumCard.displayName = 'PremiumCard';

// ============================================
// STAT CARD
// ============================================
interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; label?: string };
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  onClick?: () => void;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  action?: { label: string; onClick: () => void };
}

export const StatCard = ({
  label,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  onClick,
  trend,
  loading = false,
  action,
}: StatCardProps) => {
  return (
    <PremiumCard
      hover={!!onClick}
      onClick={onClick}
      className="group"
      padding="sm"
    >
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', iconBg)}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        )}
        {onClick && (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        )}
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="h-7 w-20 bg-muted animate-pulse rounded-lg" />
        ) : (
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>

      {change && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-medium',
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-coral' : 'text-muted-foreground'
        )}>
          {trend === 'up' && <span>↑</span>}
          {trend === 'down' && <span>↓</span>}
          <span>{change.value > 0 ? '+' : ''}{change.value}</span>
          {change.label && <span className="text-muted-foreground">{change.label}</span>}
        </div>
      )}

      {action && (
        <button
          onClick={(e) => { e.stopPropagation(); action.onClick(); }}
          className="mt-3 text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 group/btn"
        >
          {action.label}
          <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      )}
    </PremiumCard>
  );
};

// ============================================
// BUTTON VARIANTS
// ============================================
interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    disabled,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[8px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_-8px_oklch(0.72_0.19_28/0.4)] focus:ring-primary',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
      outline: 'border border-border bg-card/50 hover:bg-card text-foreground focus:ring-primary',
      ghost: 'bg-transparent hover:bg-card text-foreground focus:ring-primary',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/92 shadow-[0_0_20px_-8px_oklch(0.65_0.24_28/0.4)] focus:ring-destructive',
      success: 'bg-primary/10 text-primary hover:bg-primary/20 focus:ring-primary',
    };

    const sizeStyles = {
      sm: 'h-9 px-4 text-sm gap-2',
      md: 'h-11 px-6 text-sm gap-2',
      lg: 'h-14 px-8 text-base gap-3',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
          </>
        )}
      </button>
    );
  }
);
PremiumButton.displayName = 'PremiumButton';

// ============================================
// SECTION HEADER
// ============================================
interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: ReactNode;
  badge?: string;
}

export const SectionHeader = ({
  title,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  action,
  badge,
}: SectionHeaderProps) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-2">
      {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
      )}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {badge && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ============================================
// PAGE HEADER
// ============================================
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryActions,
}: PageHeaderProps) => (
  <div className="mb-8">
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {crumb.href ? (
              <a href={crumb.href} className="hover:text-primary transition-colors">
                {crumb.label}
              </a>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    )}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {secondaryActions}
        {primaryAction}
      </div>
    </div>
  </div>
);

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && (
      <div className="h-16 w-16 rounded-3xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);

// ============================================
// STATUS BADGE
// ============================================
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label: string;
  dot?: boolean;
}

export const StatusBadge = ({ status, label, dot = true }: StatusBadgeProps) => {
  const styles = {
    success: 'bg-emerald/15 text-emerald border-emerald/30',
    warning: 'bg-amber/15 text-amber border-amber/30',
    error: 'bg-destructive/15 text-destructive border-destructive/30',
    info: 'bg-blue/15 text-blue border-blue/30',
    neutral: 'bg-card/50 text-foreground/70 border-border',
  };

  const dotStyles = {
    success: 'bg-emerald',
    warning: 'bg-amber',
    error: 'bg-destructive',
    info: 'bg-blue',
    neutral: 'bg-muted-foreground',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      styles[status]
    )}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[status])} />}
      {label}
    </span>
  );
};

// ============================================
// QUICK ACTION BUTTON
// ============================================
interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

export const QuickAction = ({
  icon: Icon,
  label,
  description,
  onClick,
  color = 'bg-primary/20 text-primary',
  disabled = false,
}: QuickActionProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card',
      'hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20',
      'transition-all duration-200 w-full text-center group',
      disabled && 'opacity-50 cursor-not-allowed hover:shadow-none hover:translate-y-0'
    )}
  >
    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', color)}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
      {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
    </div>
  </button>
);

// ============================================
// LOADING SKELETON
// ============================================
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('bg-card rounded-2xl border border-border/50 p-6 animate-pulse', className)}>
    <div className="h-12 w-12 bg-muted rounded-2xl mb-4" />
    <div className="h-8 w-24 bg-muted rounded-lg mb-2" />
    <div className="h-4 w-32 bg-muted rounded-md" />
  </div>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 animate-pulse">
        <div className="h-10 w-10 bg-muted rounded-xl" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-muted rounded-md mb-2" />
          <div className="h-3 w-24 bg-muted rounded-md" />
        </div>
      </div>
    ))}
  </div>
);
