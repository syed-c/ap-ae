/**
 * Premium Dentist Dashboard Sidebar
 * Compact, visually appealing sidebar with theme colors
 */

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Clock,
  Stethoscope,
  Users,
  Inbox,
  ClipboardList,
  Zap,
  UserCog,
  Shield,
  Star,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';

// Navigation structure
const NAV_SECTIONS = [
  {
    title: 'Dashboard',
    items: [
      { id: 'my-dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    title: 'My Practice',
    items: [
      { id: 'my-practice', label: 'Practice Info', icon: Building2 },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'my-appointments', label: 'Appointments', icon: Calendar, showBadge: true },
      { id: 'my-availability', label: 'Availability', icon: Clock },
      { id: 'my-appointment-types', label: 'Appointment Types', icon: Stethoscope },
      { id: 'my-patients', label: 'Patients', icon: Users },
      { id: 'my-messages', label: 'Messages', icon: Inbox },
      { id: 'my-intake-forms', label: 'Intake Forms', icon: ClipboardList },
      { id: 'my-form-workflows', label: 'Form Automation', icon: Zap, badge: 'AI' },
      { id: 'my-operations', label: 'Automation', icon: Zap },
    ],
  },
  {
    title: 'Profile',
    items: [
      { id: 'my-profile', label: 'Edit Profile', icon: Building2 },
      { id: 'my-team', label: 'Team', icon: UserCog },
      { id: 'my-services', label: 'Treatments', icon: Stethoscope },
      { id: 'my-insurance', label: 'Insurance', icon: Shield },
    ],
  },
  {
    title: 'Reputation',
    items: [
      { id: 'my-reputation', label: 'Reputation Suite', icon: Star, badge: 'PRO' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { id: 'my-templates', label: 'Templates', icon: FileText },
      { id: 'my-notifications', label: 'Notifications', icon: Inbox },
    ],
  },
  {
    title: 'Settings',
    items: [
      { id: 'my-settings', label: 'Settings', icon: Settings },
      { id: 'my-support', label: 'Support', icon: HelpCircle },
    ],
  },
];

interface DentistSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export default function DentistSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onCollapsedChange,
}: DentistSidebarProps) {
  const { user, signOut } = useAuth();

  // Fetch clinic data
  const { data: clinic } = useQuery({
    queryKey: ['sidebar-clinic', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, slug, cover_image_url, verification_status, rating, review_count')
        .eq('claimed_by', user?.id)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch pending appointments count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['sidebar-pending-count', clinic?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinic?.id)
        .eq('status', 'pending');
      return count || 0;
    },
    enabled: !!clinic?.id,
  });

  const NavItem = ({ item }: { item: typeof NAV_SECTIONS[0]['items'][0] }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    const showBadgeCount = item.showBadge && pendingCount > 0;

    const content = (
      <button
        onClick={() => onTabChange(item.id)}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-[8px] px-3 py-3 transition-all duration-200',
          'text-[13px] font-medium',
          isActive
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed && 'justify-center px-2.5'
        )}
      >
        <Icon className={cn(
          'h-4 w-4 flex-shrink-0 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
        )} />

        {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}

        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>

            {showBadgeCount && (
              <Badge className="h-5 min-w-5 justify-center px-1 text-[10px] font-bold">
                {pendingCount > 9 ? '9+' : pendingCount}
              </Badge>
            )}

            {item.badge === 'AI' && (
              <Badge variant="outline" className="h-4 px-1 text-[9px] font-bold">
                AI
              </Badge>
            )}
            {item.badge === 'PRO' && (
              <Badge variant="warning" className="h-4 px-1 text-[9px] font-bold">
                PRO
              </Badge>
            )}
          </>
        )}
      </button>
    );

    if (collapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {item.label}
              {showBadgeCount && (
                <Badge className="h-4 min-w-4 px-1 text-[9px]">
                  {pendingCount}
                </Badge>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col',
        'border-r border-border bg-card shadow-[0_2px_8px_rgba(17,27,33,0.08)]',
        'transition-all duration-300 ease-out',
        collapsed ? 'w-[84px]' : 'w-[340px]'
      )}
    >
      <div className={cn(
        'flex h-[72px] items-center gap-3 border-b border-primary/20 bg-primary px-4 text-primary-foreground',
        collapsed && 'justify-center'
      )}>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-[0_0_20px_-4px_oklch(0.61_0.12_190/0.4)]">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">Dashboard</div>
            <span className="text-sm font-medium text-primary-foreground">AppointPanda</span>
          </div>
        )}
      </div>

      {!collapsed && clinic && (
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3 rounded-[10px] bg-muted p-3">
            <Avatar className="h-10 w-10 rounded-full border border-border">
              <AvatarImage src={clinic.cover_image_url || undefined} />
              <AvatarFallback className="rounded-full bg-accent text-secondary font-semibold text-xs">
                {clinic.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary truncate">{clinic.name}</p>
              <div className="flex items-center gap-1">
                {clinic.verification_status === 'verified' && (
                  <Badge variant="success" className="h-4 px-1.5 text-[8px]">
                    ✓
                  </Badge>
                )}
                {(clinic.rating || 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    {Number(clinic.rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-4 py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-border bg-card">
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            'flex w-full items-center gap-2 px-4 py-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-secondary',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>

        <div className={cn('border-t border-border p-3', collapsed && 'flex flex-col items-center')}>
          <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
            <Avatar className={cn('h-9 w-9 border border-border')}>
              <AvatarFallback className="bg-muted text-secondary font-medium text-xs">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary truncate">
                  {user?.email?.split('@')[0]}
                </p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className={cn(
              'mt-2 h-8 text-xs text-secondary hover:bg-accent hover:text-secondary',
              collapsed ? 'w-7 p-0' : 'w-full justify-start gap-1.5'
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
