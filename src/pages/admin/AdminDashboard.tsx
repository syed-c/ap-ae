'use client';
// Admin Dashboard - Main Entry Point
import { useState, useEffect, useMemo, Suspense } from 'react';
import { lazyRetry } from '@/utils/lazyRetry';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useBookingNotifications, useMarkNotificationRead } from '@/hooks/useAdminAppointments';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard,
  MapPin,
  Stethoscope,
  Building2,
  Shield,
  Users,
  Calendar,
  CalendarDays,
  UserPlus,
  FileText,
  BookOpen,
  Search,
  Bot,
  Lock,
  CreditCard,
  ClipboardList,
  Menu,
  X,
  LogOut,
  Globe,
  Mail,
  Settings,
  Palette,
  TrendingUp,
  MessageSquare,
  Target,
  Bell,
  ChevronRight,
  Phone,
  Inbox,
  Zap,
  Star,
  Flag,
  Activity,
  Clock,
  Sparkles,
  Database,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Lazy-load ALL tab components for fast initial load (with retry for stale chunks)
const OverviewTab = lazyRetry(() => import('@/components/admin/tabs/OverviewTab'));
const LocationsTab = lazyRetry(() => import('@/components/admin/tabs/LocationsTab'));
const TreatmentsTab = lazyRetry(() => import('@/components/admin/tabs/TreatmentsTab'));
const ClinicsTab = lazyRetry(() => import('@/components/admin/tabs/ClinicsTab'));
const ClaimsTab = lazyRetry(() => import('@/components/admin/tabs/ClaimsTab'));
const UsersTab = lazyRetry(() => import('@/components/admin/tabs/UsersTab'));
const AppointmentsTab = lazyRetry(() => import('@/components/admin/tabs/AppointmentsTab'));
const LeadsTab = lazyRetry(() => import('@/components/admin/tabs/LeadsTab'));
const PagesTab = lazyRetry(() => import('@/components/admin/tabs/PagesTab'));
const BlogTab = lazyRetry(() => import('@/components/admin/tabs/BlogTab'));
const SeoTab = lazyRetry(() => import('@/components/admin/tabs/SeoTab'));
const AutomationTab = lazyRetry(() => import('@/components/admin/tabs/AutomationTab'));
const RolesTab = lazyRetry(() => import('@/components/admin/tabs/RolesTab'));
const SubscriptionsTab = lazyRetry(() => import('@/components/admin/tabs/SubscriptionsTab'));
const AuditLogsTab = lazyRetry(() => import('@/components/admin/tabs/AuditLogsTab'));
const GmbBridgeTab = lazyRetry(() => import('@/components/admin/tabs/GmbBridgeTab'));
const GmbScraperBotTab = lazyRetry(() => import('@/components/admin/tabs/GmbScraperBotTab'));
const OutreachTab = lazyRetry(() => import('@/components/admin/tabs/OutreachTab'));
const SettingsTab = lazyRetry(() => import('@/components/admin/tabs/SettingsTab'));
const SiteConfigTab = lazyRetry(() => import('@/components/admin/tabs/SiteConfigTab'));
const SmokeTestTab = lazyRetry(() => import('@/components/admin/tabs/SmokeTestTab'));
const RankingRulesTab = lazyRetry(() => import('@/components/admin/tabs/RankingRulesTab'));
const ReviewInsightsTab = lazyRetry(() => import('@/components/admin/tabs/ReviewInsightsTab'));
const SeoCopilotTab = lazyRetry(() => import('@/components/admin/tabs/SeoCopilotTab'));
const CrmNumbersTab = lazyRetry(() => import('@/components/admin/tabs/CrmNumbersTab'));
const MessagingControlTab = lazyRetry(() => import('@/components/admin/tabs/MessagingControlTab'));
const PlansTab = lazyRetry(() => import('@/components/admin/tabs/PlansTab'));
const PromotionsTab = lazyRetry(() => import('@/components/admin/tabs/PromotionsTab'));
const FounderWeeklyTab = lazyRetry(() => import('@/components/admin/tabs/FounderWeeklyTab'));
const TopDentistsTab = lazyRetry(() => import('@/components/admin/tabs/TopDentistsTab'));
const PinnedProfilesTab = lazyRetry(() => import('@/components/admin/tabs/PinnedProfilesTab'));
const DentistDashboardTab = lazyRetry(() => import('@/components/admin/tabs/DentistDashboardTab'));
const ProfileEditorTab = lazyRetry(() => import('@/components/dentist/ProfileEditorTab'));
const ServicesTab = lazyRetry(() => import('@/components/dentist/ServicesTab'));
const DentistReviewsTab = lazyRetry(() => import('@/components/dentist/DentistReviewsTab'));
const DentistAppointmentsTab = lazyRetry(() => import('@/components/dentist/DentistAppointmentsTab'));
const PatientsTab = lazyRetry(() => import('@/components/dentist/PatientsTab'));
const MessagesTab = lazyRetry(() => import('@/components/dentist/MessagesTab'));
const OperationsTab = lazyRetry(() => import('@/components/dentist/OperationsTab'));
const ReviewRequestsTab = lazyRetry(() => import('@/components/dentist/ReviewRequestsTab'));
const ReputationGrowthTab = lazyRetry(() => import('@/components/dentist/ReputationGrowthTab'));
const DentistReputationHub = lazyRetry(() => import('@/components/reputation/DentistReputationHub'));
const AdminReputationHub = lazyRetry(() => import('@/components/reputation/AdminReputationHub'));
const SupportTicketsTab = lazyRetry(() => import('@/components/dentist/SupportTicketsTab'));
const TeamManagementTab = lazyRetry(() => import('@/components/dentist/TeamManagementTab'));
const DentistSettingsTab = lazyRetry(() => import('@/components/dentist/DentistSettingsTab'));
const TemplatesTab = lazyRetry(() => import('@/components/dentist/TemplatesTab'));
const InsuranceManagementTab = lazyRetry(() => import('@/components/dentist/InsuranceManagementTab'));
const IntakeFormsTab = lazyRetry(() => import('@/components/dentist/IntakeFormsTab'));
const AIControlsTab = lazyRetry(() => import('@/components/admin/tabs/AIControlsTab'));
const AISearchControlTab = lazyRetry(() => import('@/components/admin/tabs/AISearchControlTab').then(m => ({ default: m.AISearchControlTab })));
const ApiControlTab = lazyRetry(() => import('@/components/admin/tabs/ApiControlTab'));
const PlatformServicesTab = lazyRetry(() => import('@/components/admin/tabs/PlatformServicesTab'));
const SupportTicketsAdminTab = lazyRetry(() => import('@/components/admin/tabs/SupportTicketsAdminTab'));
const GMBConnectionsTab = lazyRetry(() => import('@/components/admin/tabs/GMBConnectionsTab'));
const ContactDetailsTab = lazyRetry(() => import('@/components/admin/tabs/ContactDetailsTab'));
const SeoBotTab = lazyRetry(() => import('@/components/admin/tabs/SeoBotTab'));
const SeoContentOptimizerTab = lazyRetry(() => import('@/components/admin/tabs/SeoContentOptimizerTab'));
const SeoExpertTab = lazyRetry(() => import('@/components/admin/tabs/SeoExpertTab'));
const SeoCommandCenterTab = lazyRetry(() => import('@/components/admin/tabs/SeoCommandCenterTab'));
const RankingControlCenterTab = lazyRetry(() => import('@/components/admin/tabs/RankingControlCenterTab'));
const SeoOperationsCenterTab = lazyRetry(() => import('@/components/admin/tabs/SeoOperationsCenterTab'));
const ContentGenerationStudioTab = lazyRetry(() => import('@/components/admin/tabs/ContentGenerationStudioTab'));
const FAQGenerationStudioTab = lazyRetry(() => import('@/components/admin/tabs/FAQGenerationStudioTab'));
const ContentAuditBotTab = lazyRetry(() => import('@/components/admin/tabs/ContentAuditBotTab'));
const Phase2SprintHubTab = lazyRetry(() => import('@/components/admin/tabs/Phase2SprintHubTab'));
const Phase3SprintHubTab = lazyRetry(() => import('@/components/admin/tabs/Phase3SprintHubTab'));
const Phase4SprintHubTab = lazyRetry(() => import('@/components/admin/tabs/Phase4SprintHubTab'));
const ClinicEnrichmentTab = lazyRetry(() => import('@/components/admin/tabs/ClinicEnrichmentTab'));
const EmailEnrichmentBotTab = lazyRetry(() => import('@/components/admin/tabs/EmailEnrichmentBotTab'));
const SystemAuditTab = lazyRetry(() => import('@/components/admin/tabs/SystemAuditTab'));
const FeatureFlagsTab = lazyRetry(() => import('@/components/admin/tabs/FeatureFlagsTab'));
const MarketplaceControlTab = lazyRetry(() => import('@/components/admin/tabs/MarketplaceControlTab'));
const BookingSystemTab = lazyRetry(() => import('@/components/admin/tabs/BookingSystemTab'));
const TabVisibilityTab = lazyRetry(() => import('@/components/admin/tabs/TabVisibilityTab'));
const VisitorAnalyticsTab = lazyRetry(() => import('@/components/admin/tabs/VisitorAnalyticsTab'));
const StaticPagesTab = lazyRetry(() => import('@/components/admin/tabs/StaticPagesTab'));
const SeoHealthCheckTab = lazyRetry(() => import('@/components/admin/tabs/SeoHealthCheckTab'));
const MetaOptimizerTab = lazyRetry(() => import('@/components/admin/tabs/MetaOptimizerTab'));
const GeoExpansionTab = lazyRetry(() => import('@/components/admin/tabs/GeoExpansionTab'));
const MicroLocationCoverageTab = lazyRetry(() => import('@/components/admin/tabs/MicroLocationCoverageTab'));
const StructuredDataTab = lazyRetry(() => import('@/components/admin/tabs/StructuredDataTab'));
const ToolsManagementTab = lazyRetry(() => import('@/components/admin/tabs/ToolsManagementTab'));
const AvailabilityManagementTab = lazyRetry(() => import('@/components/dentist/AvailabilityManagementTab'));
const AppointmentTypesTab = lazyRetry(() => import('@/components/dentist/AppointmentTypesTab'));
const MigrationControlTab = lazyRetry(() => import('@/components/admin/tabs/MigrationControlTab').then(m => ({ default: m.MigrationControlTab })));
const DataRecoveryTab = lazyRetry(() => import('@/components/admin/tabs/DataRecoveryTab'));
const AdminRevertTab = lazyRetry(() => import('@/components/admin/tabs/AdminRevertTab'));
const ContentCommandCenterTab = lazyRetry(() => import('@/components/admin/tabs/ContentCommandCenterTab'));
const InternalLinkingHubTab = lazyRetry(() => import('@/components/admin/tabs/InternalLinkingHubTab'));
const QualityIdentityTab = lazyRetry(() => import('@/components/admin/tabs/QualityIdentityTab'));
const ContentStrategyTab = lazyRetry(() => import('@/components/admin/tabs/ContentStrategyTab'));
const PriceComparisonControlTab = lazyRetry(() => import('@/components/admin/tabs/PriceComparisonControlTab'));

import NotificationCenter from '@/components/admin/NotificationCenter';
import { useNotificationSubscription } from '@/hooks/useNotifications';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { useUserTabAccess } from '@/hooks/useUserTabAccess';

// Lazy load the V2 dashboard for dentists
const DentistDashboardV2 = lazyRetry(() => import('@/components/dashboard-v2/DentistDashboardV2'));

// Define tabs for dentists (comprehensive view)
const dentistTabGroups = [
  {
    label: 'Dashboard',
    tabs: [
      { id: 'my-dashboard', label: 'My Practice', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operations',
    tabs: [
      { id: 'my-appointments', label: 'Appointments', icon: Calendar, highlight: true },
      { id: 'my-availability', label: 'Availability', icon: Clock },
      { id: 'my-appointment-types', label: 'Appointment Types', icon: Stethoscope },
      { id: 'my-patients', label: 'Patients', icon: Users },
      { id: 'my-messages', label: 'Messages', icon: Inbox },
      { id: 'my-intake-forms', label: 'Intake Forms', icon: ClipboardList },
      { id: 'my-operations', label: 'Automation', icon: Zap },
    ],
  },
  {
    label: 'Profile',
    tabs: [
      { id: 'my-profile', label: 'Edit Profile', icon: Building2 },
      { id: 'my-team', label: 'Team', icon: Users },
      { id: 'my-services', label: 'Services', icon: Stethoscope },
      { id: 'my-insurance', label: 'Insurance', icon: Shield },
    ],
  },
  {
    label: 'Reputation',
    tabs: [
      { id: 'my-reputation', label: 'Reputation Suite', icon: Star, highlight: true },
    ],
  },
  {
    label: 'Communication',
    tabs: [
      { id: 'my-templates', label: 'Templates', icon: FileText },
    ],
  },
  {
    label: 'Settings',
    tabs: [
      { id: 'my-settings', label: 'Settings', icon: Settings },
      { id: 'my-support', label: 'Support Tickets', icon: Shield },
    ],
  },
];

const adminTabGroups = [
  {
    label: 'Command Center',
    tabs: [
      { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
      { id: 'weekly', label: 'Weekly Report', icon: TrendingUp },
      { id: 'visitor-analytics', label: 'Visitor Analytics', icon: Activity, highlight: true },
      { id: 'top-dentists', label: 'Top Dentists', icon: Star },
      { id: 'pinned-profiles', label: 'Pinned Profiles', icon: Star },
    ],
  },
  {
    label: 'Marketplace',
    tabs: [
      { id: 'clinics', label: 'Dental Offices', icon: Building2 },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'claims', label: 'Claims', icon: Shield },
      { id: 'treatments', label: 'Treatments', icon: Stethoscope },
      { id: 'locations', label: 'Locations', icon: MapPin },
      { id: 'geo-expansion', label: 'Geo Expansion', icon: Globe, highlight: true },
      { id: 'ranking-rules', label: 'Ranking Rules', icon: TrendingUp },
      { id: 'pages', label: 'Page Manager', icon: FileText },
    ],
  },
  {
    label: 'Discovery & SEO',
    tabs: [
      { id: 'ranking-control', label: 'Ranking Control Center', icon: TrendingUp, highlight: true },
      { id: 'seo-command-center', label: 'SEO Command Center', icon: Sparkles },
      { id: 'seo-operations', label: 'SEO Operations', icon: Sparkles },
      { id: 'seo-health', label: 'SEO Health Check', icon: Activity },
      { id: 'meta-optimizer', label: 'Meta Optimizer', icon: Search },
      { id: 'structured-data', label: 'Schema & Structured Data', icon: Database, highlight: true },
      { id: 'content-audit', label: 'Content Audit Bot', icon: Activity, highlight: true },
      { id: 'internal-linking', label: 'Internal Linking', icon: Globe, highlight: true },
      { id: 'micro-location', label: 'Micro-Location Coverage', icon: MapPin, highlight: true },
      { id: 'smoke-test', label: 'URL Smoke Test', icon: Globe },
    ],
  },
  {
    label: 'Reputation',
    tabs: [
      { id: 'reputation-hub', label: 'Reputation Hub', icon: Shield, highlight: true },
      { id: 'review-insights', label: 'Review Insights', icon: MessageSquare },
      { id: 'gmb-connections', label: 'GMB Connections', icon: Globe },
    ],
  },
  {
    label: 'Patient & Bookings',
    tabs: [
      { id: 'booking-system', label: 'Booking System', icon: CalendarDays, highlight: true },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'leads', label: 'Lead CRM', icon: UserPlus },
    ],
  },
  {
    label: 'Growth & Marketing',
    tabs: [
      { id: 'gmb-scraper', label: 'Scraper Bot', icon: Bot, highlight: true },
      { id: 'email-enrichment', label: 'Email Enrichment', icon: Mail, highlight: true },
      { id: 'gmb-bridge', label: 'Google Import', icon: Globe },
      { id: 'outreach', label: 'Outreach Center', icon: Mail },
      { id: 'promotions', label: 'Promotions', icon: Target },
    ],
  },
  {
    label: 'AI & Automation',
    tabs: [
      { id: 'ai-controls', label: 'AI Controls', icon: Bot },
      { id: 'ai-search-control', label: 'AI Search', icon: Search, highlight: true },
      { id: 'automation', label: 'Automation Rules', icon: Zap },
    ],
  },
  {
    label: 'Content Management',
    tabs: [
      { id: 'content-command-center', label: 'Content Hub', icon: Bot, highlight: true },
      { id: 'quality-identity', label: 'Quality & Identity', icon: Activity, highlight: true },
      { id: 'content-studio', label: 'Content Studio', icon: Sparkles, highlight: true },
      { id: 'faq-studio', label: 'FAQ Studio', icon: Search, highlight: true },
      { id: 'clinic-enrichment', label: 'Clinic Enrichment', icon: Sparkles, highlight: true },
      { id: 'blog', label: 'Blog Engine', icon: BookOpen },
      { id: 'content-strategy', label: 'Content Strategy', icon: Calendar, highlight: true },
      { id: 'static-pages', label: 'Static Pages', icon: Globe },
      { id: 'seo-content-optimizer', label: 'Content Optimizer', icon: Zap },
      { id: 'phase2-sprint-hub', label: 'Services Sprint', icon: Target, highlight: true },
      { id: 'phase3-sprint-hub', label: 'Locations Sprint', icon: TrendingUp, highlight: true },
      { id: 'phase4-sprint-hub', label: 'Optimization Sprint', icon: Activity, highlight: true },
    ],
  },
  {
    label: 'Monetization',
    tabs: [
      { id: 'plans', label: 'Plans & Features', icon: CreditCard },
      { id: 'subscriptions', label: 'Revenue', icon: CreditCard },
      { id: 'marketplace-control', label: 'Marketplace Control', icon: Target, highlight: true },
    ],
  },
  {
    label: 'Integrations',
    tabs: [
      { id: 'api-control', label: 'API Control', icon: Zap },
      { id: 'crm-numbers', label: 'CRM Numbers', icon: Phone },
      { id: 'messaging-control', label: 'Messaging', icon: MessageSquare },
      { id: 'platform-services', label: 'Platform Services', icon: Zap },
    ],
  },
  {
    label: 'Platform Settings',
    tabs: [
      { id: 'site-config', label: 'Header / Footer', icon: Palette },
      { id: 'contact-details', label: 'Contact Details', icon: Phone },
      { id: 'tab-visibility', label: 'Tab Visibility', icon: Activity },
      { id: 'tools-management', label: 'Tools Management', icon: Sparkles, highlight: true },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'System Diagnostics',
    tabs: [
      { id: 'system-audit', label: 'System Audit', icon: Activity, highlight: true },
      { id: 'feature-flags', label: 'Feature Flags', icon: Flag, highlight: true },
      { id: 'roles', label: 'Access Control', icon: Lock },
      { id: 'audit', label: 'Audit Logs', icon: ClipboardList },
      { id: 'migration-control', label: 'Migration Control', icon: Database, highlight: true },
      { id: 'data-recovery', label: 'Data Recovery', icon: RotateCcw, highlight: true },
      { id: 'admin-revert', label: 'Revert Actions', icon: ClipboardList, highlight: true },
      { id: 'support-admin', label: 'Support Tickets', icon: Shield },
    ],
  },
];

export default function AdminDashboard() {
  const { user, roles, signOut, isLoading, refreshRoles } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Define roles that can access admin dashboard
  const ADMIN_ROLES = ['super_admin', 'district_manager', 'seo_team', 'content_team', 'marketing_team', 'support_team'];
  const isAdmin = roles.some(role => ADMIN_ROLES.includes(role));
  const isSuperAdmin = roles.includes('super_admin') || roles.includes('district_manager');
  const isDentist = roles.includes('dentist');
  const primaryRole = roles[0] || 'patient';

  const [activeTab, setActiveTab] = useState<string>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl || (isAdmin ? 'overview' : 'my-dashboard');
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [roleCheckAttempts, setRoleCheckAttempts] = useState(0);

  // Set noindex for admin/dashboard pages - they should not be indexed
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');
    
    return () => {
      meta?.setAttribute('content', 'index, follow');
    };
  }, []);

  // Auto-refresh roles if user has no roles (may happen after fresh signup)
  useEffect(() => {
    if (isAdmin) return;
    
    if (!isLoading && user && roles.length === 0 && roleCheckAttempts < 2) {
      const timer = setTimeout(() => {
        refreshRoles();
        setRoleCheckAttempts(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, roles, roleCheckAttempts, refreshRoles, isAdmin]);

  // Get global tab visibility settings
  const { isTabVisible } = useTabVisibility();
  
  // Get user-specific tab access permissions
  const { canAccessTab, hasFullAccess } = useUserTabAccess();

  // Determine which tab groups to show and filter by visibility + user permissions
  const rawTabGroups = isAdmin ? adminTabGroups : dentistTabGroups;
  const dashboardType = isAdmin ? 'admin' : 'dentist';
  
  const tabGroups = useMemo(() => 
    rawTabGroups.map(group => ({
      ...group,
      tabs: group.tabs.filter(tab => {
        if (!isTabVisible(tab.id, dashboardType)) return false;
        if (dashboardType === 'admin' && !hasFullAccess) {
          return canAccessTab(tab.id);
        }
        return true;
      }),
    })).filter(group => group.tabs.length > 0),
    [rawTabGroups, dashboardType, isTabVisible, hasFullAccess, canAccessTab]
  );

  // Helper to navigate to a tab - just update state and URL without triggering re-renders
  const navigateToTab = (tabId: string) => {
    const basePath = isAdmin ? '/admin' : '/dashboard';
    setActiveTab(tabId);
    // Use window.history to avoid React re-render cycle
    window.history.replaceState(null, '', `${basePath}?tab=${tabId}`);
  };

  // Sync active tab from URL ONLY on initial mount or when searchParams actually change from outside
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const { data: notifications } = useBookingNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = notifications?.length || 0;

  // Subscribe to real-time notifications
  useNotificationSubscription();

  // Real-time notifications
  useEffect(() => {
    const channel = supabase
      .channel('booking-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_notifications',
      }, () => {
        // Refetch handled by react-query
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Only show loading if auth is genuinely loading (not during tab switches)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Route separation:
  // - /admin is for admins only
  // - /dashboard is for dentists only
  const tabParam = searchParams.get('tab');

  // If a dentist lands on /admin, push them to the dentist dashboard route
  if (location.pathname.startsWith('/admin') && !isAdmin && isDentist) {
    const targetTab = tabParam && tabParam.startsWith('my-') ? tabParam : 'my-dashboard';
    return <Navigate to={`/dashboard?tab=${encodeURIComponent(targetTab)}`} replace />;
  }

  // If an admin lands on /dashboard, push them to /admin but preserve the tab param
  if (location.pathname.startsWith('/dashboard') && isAdmin) {
    const preservedTab = tabParam || 'overview';
    return <Navigate to={`/admin?tab=${preservedTab}`} replace />;
  }

  // Access control: admins and dentists only
  // Give a retry option for users who just signed up and roles haven't propagated yet
  // SuperAdmins never see this screen - they are fast-tracked
  if (!isAdmin && !isDentist && roleCheckAttempts >= 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-background">
        <div className="text-center p-8 bg-card rounded-2xl shadow-lg border max-w-md">
          <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Setting Up Your Account</h1>
          <p className="text-muted-foreground mb-4">
            We're finalizing your account setup. This should only take a moment.
          </p>
          <div className="mt-6 flex gap-2 justify-center">
            <Button 
              variant="default" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            If this persists, try signing out and signing in again.
          </p>
        </div>
      </div>
    );
  }
  
  // Still loading roles - show loading spinner instead of "Setting Up Account" prematurely
  // SuperAdmins bypass this entirely
  if (!isAdmin && !isDentist && roleCheckAttempts < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if this is a dentist accessing their dashboard - redirect to V2
  const isDentistRoute = location.pathname.startsWith('/dashboard') && isDentist && !isAdmin;
  
  // For dentists, use the redesigned V2 dashboard
  if (isDentistRoute) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      }>
        <DentistDashboardV2 />
      </Suspense>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'my-dashboard': return <DentistDashboardTab />;
      case 'my-appointments': return <DentistAppointmentsTab />;
      case 'my-availability': return <AvailabilityManagementTab />;
      case 'my-appointment-types': return <AppointmentTypesTab />;
      case 'my-patients': return <PatientsTab />;
      case 'my-messages': return <MessagesTab />;
      case 'my-operations': return <OperationsTab />;
      case 'my-intake-forms': return <IntakeFormsTab />;
      case 'my-profile': return <ProfileEditorTab />;
      case 'my-team': return <TeamManagementTab />;
      case 'my-services': return <ServicesTab />;
      case 'my-insurance': return <InsuranceManagementTab />;
      case 'my-reputation': return <DentistReputationHub />;
      case 'my-templates': return <TemplatesTab />;
      case 'my-settings': return <DentistSettingsTab />;
      case 'my-support': return <SupportTicketsTab />;
      case 'overview': return <OverviewTab />;
      case 'weekly': return <FounderWeeklyTab />;
      case 'gmb-bridge': return <GmbBridgeTab />;
      case 'gmb-scraper': return <GmbScraperBotTab />;
      case 'gmb-connections': return <GMBConnectionsTab />;
      case 'email-enrichment': return <EmailEnrichmentBotTab />;
      case 'outreach': return <OutreachTab />;
      case 'ranking-rules': return <RankingRulesTab />;
      case 'pinned-profiles': return <PinnedProfilesTab />;
      case 'top-dentists': return <TopDentistsTab />;
      case 'promotions': return <PromotionsTab />;
      case 'locations': return <LocationsTab />;
      case 'treatments': return <TreatmentsTab />;
      case 'clinics': return <ClinicsTab />;
      case 'claims': return <ClaimsTab />;
      case 'users': return <UsersTab />;
      case 'booking-system': return <BookingSystemTab />;
      case 'appointments': return <AppointmentsTab />;
      case 'visitor-analytics': return <VisitorAnalyticsTab />;
      case 'leads': return <LeadsTab />;
      case 'pages': return <PagesTab />;
      case 'blog': return <BlogTab />;
      case 'seo': return <SeoTab />;
      case 'static-pages': return <StaticPagesTab />;
      case 'seo-health': return <SeoHealthCheckTab />;
      case 'seo-command-center': return <SeoCommandCenterTab />;
      case 'ranking-control': return <RankingControlCenterTab />;
      case 'seo-operations': return <SeoOperationsCenterTab />;
      case 'meta-optimizer': return <MetaOptimizerTab />;
      case 'seo-expert': return <SeoExpertTab />;
      case 'structured-data': return <StructuredDataTab />;
      case 'seo-bot': return <SeoBotTab />;
      case 'seo-copilot': return <SeoCopilotTab />;
      case 'seo-content-optimizer': return <SeoContentOptimizerTab />;
      case 'phase2-sprint-hub': return <Phase2SprintHubTab />;
      case 'phase3-sprint-hub': return <Phase3SprintHubTab />;
      case 'phase4-sprint-hub': return <Phase4SprintHubTab />;
      case 'content-studio': return <ContentGenerationStudioTab />;
      case 'tools-management': return <ToolsManagementTab />;
      case 'faq-studio': return <FAQGenerationStudioTab />;
      case 'content-audit': return <ContentAuditBotTab />;
      case 'content-command-center': return <ContentCommandCenterTab />;
      case 'quality-identity': return <QualityIdentityTab />;
      case 'internal-linking': return <InternalLinkingHubTab />;
      case 'content-strategy': return <ContentStrategyTab />;
      case 'price-comparison': return <PriceComparisonControlTab />;
      case 'micro-location': return <MicroLocationCoverageTab />;
      case 'clinic-enrichment': return <ClinicEnrichmentTab />;
      case 'smoke-test': return <SmokeTestTab />;
      case 'automation': return <AutomationTab />;
      case 'ai-controls': return <AIControlsTab />;
      case 'ai-search-control': return <AISearchControlTab />;
      case 'api-control': return <ApiControlTab />;
      case 'platform-services': return <PlatformServicesTab />;
      case 'support-admin': return <SupportTicketsAdminTab />;
      case 'reputation-hub': return <AdminReputationHub />;
      case 'review-insights': return <ReviewInsightsTab />;
      case 'crm-numbers': return <CrmNumbersTab />;
      case 'messaging-control': return <MessagingControlTab />;
      case 'plans': return <PlansTab />;
      case 'roles': return <RolesTab />;
      case 'subscriptions': return <SubscriptionsTab />;
      case 'audit': return <AuditLogsTab />;
      case 'system-audit': return <SystemAuditTab />;
      case 'feature-flags': return <FeatureFlagsTab />;
      case 'marketplace-control': return <MarketplaceControlTab />;
      case 'site-config': return <SiteConfigTab />;
      case 'contact-details': return <ContactDetailsTab />;
      case 'tab-visibility': return <TabVisibilityTab />;
      case 'migration-control': return <MigrationControlTab />;
      case 'data-recovery': return <DataRecoveryTab />;
      case 'admin-revert': return <AdminRevertTab />;
      case 'settings': return <SettingsTab />;
      case 'geo-expansion': return <GeoExpansionTab />;
      // Default to Overview for admin route, DentistDashboard only for dentist route
      default: 
        // If on admin route, always show OverviewTab as fallback
        if (location.pathname.startsWith('/admin')) {
          return <OverviewTab />;
        }
        return <DentistDashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Sidebar - Dark Modern Design with Graphics */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 overflow-hidden',
          'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Background Graphics */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-10 w-24 h-24 bg-teal/20 rounded-full blur-2xl" />
          <div className="absolute bottom-1/4 -left-5 w-20 h-20 bg-gold/15 rounded-full blur-2xl" />
          <div className="absolute bottom-20 right-0 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>

        {/* Logo */}
        <div className="relative h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-white font-extrabold text-sm">AP</span>
              </div>
              <span className="font-display font-bold text-lg text-white">Appoint Panda</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4 relative">
          <nav className="space-y-6 px-2">
            {tabGroups.map((group) => (
              <div key={group.label}>
                {sidebarOpen && (
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => navigateToTab(tab.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group',
                          isActive
                            ? 'bg-white text-slate-900 font-semibold shadow-lg shadow-white/20'
                            : tab.highlight
                            ? 'text-primary bg-primary/10 hover:bg-primary/20'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                        )}
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'group-hover:text-primary')} />
                        {sidebarOpen && <span>{tab.label}</span>}
                        {tab.id === 'appointments' && unreadCount > 0 && sidebarOpen && (
                          <Badge className="ml-auto bg-coral text-white text-xs h-5 min-w-5 flex items-center justify-center border-0 shadow-lg shadow-coral/30">
                            {unreadCount}
                          </Badge>
                        )}
                        {/* Hover glow effect */}
                        {!isActive && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User info & Logout */}
        <div className="relative p-4 border-t border-white/10 bg-black/20">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">
                {user.email?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.email}</p>
                <p className="text-xs text-white/50 capitalize">{primaryRole?.replace('_', ' ')}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size={sidebarOpen ? 'default' : 'icon'}
            onClick={signOut}
            className={cn('mt-3 text-coral hover:text-white hover:bg-coral/20 border border-coral/30', sidebarOpen ? 'w-full' : 'w-9')}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300 min-h-screen',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        {/* Top bar - Enhanced */}
        <div className="h-16 border-b border-border/30 bg-white flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-teal" />
            <h2 className="font-bold text-foreground text-lg">
              {tabGroups.flatMap(g => g.tabs).find(t => t.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Live</span>
            </div>
            {/* Enhanced Notification Center */}
            <NotificationCenter />
          </div>
        </div>

        <div className="p-6 bg-[#f5f7fa] min-h-[calc(100vh-4rem)]">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          }>
            {renderTab()}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
