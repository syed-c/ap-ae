'use client';
import { useState, useMemo, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, MapPin, Stethoscope, BookOpen, Target, 
  TrendingUp, Activity, Sparkles, RefreshCw, Loader2, 
  BarChart3, Zap, Globe, Bot,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// Lazy load the sub-tabs
const Phase2SprintHubTab = lazy(() => import('./Phase2SprintHubTab'));
const Phase3SprintHubTab = lazy(() => import('./Phase3SprintHubTab'));
const Phase4SprintHubTab = lazy(() => import('./Phase4SprintHubTab'));
const ContentGenerationStudioTab = lazy(() => import('./ContentGenerationStudioTab'));
const ClinicEnrichmentTab = lazy(() => import('./ClinicEnrichmentTab'));
const FAQGenerationStudioTab = lazy(() => import('./FAQGenerationStudioTab'));
const ContentAuditBotTab = lazy(() => import('./ContentAuditBotTab'));
const BlogTab = lazy(() => import('./BlogTab'));
const ToolsManagementTab = lazy(() => import('./ToolsManagementTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

interface BrainSuggestion {
  type: 'content_gap' | 'thin_content' | 'missing_page' | 'topic_idea' | 'optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  targetTab?: string;
}

export default function ContentCommandCenterTab() {
  const [activeSection, setActiveSection] = useState('brain');
  const [isAuditing, setIsAuditing] = useState(false);
  const [suggestions, setSuggestions] = useState<BrainSuggestion[]>([]);

  // Platform-wide content stats
  const { data: platformStats, refetch: refetchStats } = useQuery({
    queryKey: ['content-command-stats'],
    queryFn: async () => {
      const [
        clinicsRes,
        clinicsDescRes,
        seoPagesRes,
        seoContentRes,
        blogRes,
        publishedBlogRes,
        treatmentsRes,
        citiesRes,
        areasRes,
      ] = await Promise.all([
        supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true).not('description', 'is', null),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).gt('word_count', 500),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('treatments').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('cities').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('areas').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      return {
        clinics: { total: clinicsRes.count || 0, withDesc: clinicsDescRes.count || 0 },
        seoPages: { total: seoPagesRes.count || 0, withContent: seoContentRes.count || 0 },
        blog: { total: blogRes.count || 0, published: publishedBlogRes.count || 0 },
        treatments: treatmentsRes.count || 0,
        cities: citiesRes.count || 0,
        areas: areasRes.count || 0,
        faqs: 0,
      };
    },
  });

  const [showAuditPicker, setShowAuditPicker] = useState(false);

  const auditScopes = [
    { id: 'full-audit', label: 'Full Platform Audit', desc: 'All pages, clinics, blog, FAQs' },
    { id: 'location-profiles', label: 'Location Profile Pages', desc: 'State & city pages coverage' },
    { id: 'service-location', label: 'Service-Location Pages', desc: 'Treatment + city combinations' },
    { id: 'clinics', label: 'Clinic Descriptions', desc: 'Missing or thin clinic content' },
    { id: 'seo-pages', label: 'SEO Pages Quality', desc: 'Word count, meta tags, thin content' },
    { id: 'blog', label: 'Blog Coverage', desc: 'Topic gaps and publishing status' },
  ];

  // Run AI Brain audit
  const runBrainAudit = async (scope: string = 'full-audit') => {
    setIsAuditing(true);
    setShowAuditPicker(false);
    try {
      const { data, error } = await supabase.functions.invoke('ai-brain-audit', {
        body: { action: scope },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        toast.success(`Audit complete! ${data.suggestions.length} suggestions found.`);
      }
    } catch (err) {
      toast.error(`Audit failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const overallScore = useMemo(() => {
    if (!platformStats) return 0;
    const clinicScore = platformStats.clinics.total > 0 
      ? (platformStats.clinics.withDesc / platformStats.clinics.total) * 25 : 0;
    const seoScore = platformStats.seoPages.total > 0 
      ? (platformStats.seoPages.withContent / platformStats.seoPages.total) * 25 : 0;
    const blogScore = Math.min((platformStats.blog.published / 50) * 25, 25);
    const faqScore = Math.min((platformStats.faqs / 100) * 25, 25);
    return Math.round(clinicScore + seoScore + blogScore + faqScore);
  }, [platformStats]);

  const sections = [
    { id: 'brain', label: 'AI Brain', icon: Brain, highlight: true },
    { id: 'services', label: 'Services', icon: Stethoscope },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'blog', label: 'Blog Engine', icon: BookOpen },
    { id: 'clinics', label: 'Clinic Content', icon: Globe },
    { id: 'faq', label: 'FAQ Studio', icon: Zap },
    { id: 'studio', label: 'Content Studio', icon: Sparkles },
    { id: 'audit', label: 'Content Audit', icon: Activity },
    { id: 'tools', label: 'Free Tools', icon: Zap },
    { id: 'advanced', label: 'Advanced', icon: TrendingUp },
    { id: 'optimization', label: 'Optimization', icon: Target },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-purple/10 to-teal/10 p-6 border border-primary/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-teal blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              Content Command Center
            </h1>
            <p className="text-muted-foreground mt-2">
              AI-powered content management, generation, and optimization for the entire platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Content Score</p>
              <p className="text-3xl font-bold text-primary">{overallScore}%</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Clinics', value: platformStats?.clinics.withDesc || 0, total: platformStats?.clinics.total || 0, color: 'text-primary' },
          { label: 'SEO Pages', value: platformStats?.seoPages.withContent || 0, total: platformStats?.seoPages.total || 0, color: 'text-teal' },
          { label: 'Blog Posts', value: platformStats?.blog.published || 0, total: platformStats?.blog.total || 0, color: 'text-purple' },
          { label: 'Treatments', value: platformStats?.treatments || 0, total: null, color: 'text-gold' },
          { label: 'Cities', value: platformStats?.cities || 0, total: null, color: 'text-coral' },
          { label: 'Areas', value: platformStats?.areas || 0, total: null, color: 'text-primary' },
          { label: 'FAQs', value: platformStats?.faqs || 0, total: null, color: 'text-teal' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/50">
            <CardContent className="pt-4 pb-3 px-3 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {stat.label}
                {stat.total !== null && ` / ${stat.total.toLocaleString()}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Navigation */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <div 
          className="relative w-full max-w-full"
        >
          <div 
            className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              el.style.cursor = 'grabbing';
              const startX = e.pageX;
              const scrollLeft = el.scrollLeft;
              let moved = false;
              const onMouseMove = (ev: MouseEvent) => {
                moved = true;
                const x = ev.pageX;
                el.scrollLeft = scrollLeft - (x - startX);
              };
              const onMouseUp = () => {
                el.style.cursor = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                // Prevent click if we dragged
                if (moved) {
                  const preventClick = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
                  el.addEventListener('click', preventClick, { capture: true, once: true });
                }
              };
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          >
            <TabsList className="inline-flex w-max h-12 p-1 gap-0.5 cursor-grab active:cursor-grabbing select-none">
              {sections.map((sec) => (
                <TabsTrigger 
                  key={sec.id} 
                  value={sec.id} 
                  className={`flex items-center gap-2 px-4 whitespace-nowrap text-xs shrink-0 ${sec.highlight ? 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple data-[state=active]:text-white' : ''}`}
                >
                  <sec.icon className="h-3.5 w-3.5" />
                  {sec.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* AI Brain Tab */}
        <TabsContent value="brain" className="mt-6 space-y-6">
          {/* Brain Controls */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Platform Intelligence Engine
                  </CardTitle>
                  <CardDescription>
                    AI-powered audit of all content across the platform. Analyzes locations, services, 
                    blog coverage, clinic descriptions, and SEO pages to identify gaps and opportunities.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Button 
                    onClick={() => setShowAuditPicker(!showAuditPicker)} 
                    disabled={isAuditing}
                    className="bg-gradient-to-r from-primary to-purple hover:opacity-90"
                  >
                    {isAuditing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Auditing...</>
                    ) : (
                      <><Bot className="h-4 w-4 mr-2" /> Start Audit</>
                    )}
                  </Button>
                  {showAuditPicker && (
                    <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-[320px] space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Select audit type:</p>
                      {auditScopes.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => runBrainAudit(s.id)}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors"
                        >
                          <div className="text-sm font-medium text-foreground">{s.label}</div>
                          <div className="text-xs text-muted-foreground">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-background/80 border">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">What it audits</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• All service pages & word counts</li>
                    <li>• Location coverage across Emirates</li>
                    <li>• Service-location page combinations</li>
                    <li>• Blog topic coverage & gaps</li>
                    <li>• Clinic description quality</li>
                    <li>• FAQ coverage per service</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-background/80 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple" />
                    <span className="font-medium text-sm">Suggestions it generates</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Missing service-location pages</li>
                    <li>• Thin content needing expansion</li>
                    <li>• Blog topics to cover</li>
                    <li>• Areas without clinic coverage</li>
                    <li>• SEO optimization priorities</li>
                    <li>• Internal linking opportunities</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-background/80 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-teal" />
                    <span className="font-medium text-sm">Action outcomes</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Prioritized content roadmap</li>
                    <li>• One-click generation triggers</li>
                    <li>• Cross-linked to relevant tools</li>
                    <li>• Daily/weekly audit scheduling</li>
                    <li>• Progress tracking over time</li>
                    <li>• Competitive gap analysis</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions Panel */}
          {suggestions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" />
                  AI Suggestions ({suggestions.length})
                </CardTitle>
                <CardDescription>Prioritized recommendations from the platform audit</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {suggestions.map((suggestion, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-xl border transition-colors hover:bg-muted/30 ${
                          suggestion.priority === 'high' ? 'border-coral/30 bg-coral/5' :
                          suggestion.priority === 'medium' ? 'border-gold/30 bg-gold/5' :
                          'border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="outline" 
                                className={
                                  suggestion.priority === 'high' ? 'border-coral text-coral' :
                                  suggestion.priority === 'medium' ? 'border-gold text-gold' :
                                  'border-muted-foreground text-muted-foreground'
                                }
                              >
                                {suggestion.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.type.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <h4 className="font-medium">{suggestion.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => suggestion.targetTab && setActiveSection(suggestion.targetTab)}
                          >
                            {suggestion.actionLabel}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Brain className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Audit Results Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Run Full Audit" to let the AI Brain analyze your entire platform 
                  and generate actionable content suggestions.
                </p>
                <Button 
                  onClick={() => runBrainAudit('full-audit')} 
                  disabled={isAuditing}
                  variant="outline"
                >
                  {isAuditing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
                  Start Audit
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Coverage Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Content Coverage Matrix
              </CardTitle>
              <CardDescription>Overview of content coverage across all dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Clinic Descriptions', value: platformStats?.clinics.withDesc || 0, total: platformStats?.clinics.total || 0, color: 'bg-primary' },
                  { label: 'SEO Pages (500+ words)', value: platformStats?.seoPages.withContent || 0, total: platformStats?.seoPages.total || 0, color: 'bg-teal' },
                  { label: 'Blog Posts Published', value: platformStats?.blog.published || 0, total: Math.max(platformStats?.blog.total || 0, 50), color: 'bg-purple' },
                  { label: 'FAQ Coverage', value: platformStats?.faqs || 0, total: 200, color: 'bg-gold' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value}/{item.total} ({item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%)</span>
                    </div>
                    <Progress value={item.total > 0 ? (item.value / item.total) * 100 : 0} className={`h-2 [&>div]:${item.color}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Pages (Phase 2.1) */}
        <TabsContent value="services" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <Phase2SprintHubTab />
          </Suspense>
        </TabsContent>

        {/* Location Pages (Phase 2.2 + Phase 3 Neighborhoods) */}
        <TabsContent value="locations" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <Phase3SprintHubTab />
          </Suspense>
        </TabsContent>

        {/* Blog Engine */}
        <TabsContent value="blog" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <BlogTab />
          </Suspense>
        </TabsContent>

        {/* Clinic Content */}
        <TabsContent value="clinics" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <ClinicEnrichmentTab />
          </Suspense>
        </TabsContent>

        {/* FAQ Studio */}
        <TabsContent value="faq" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <FAQGenerationStudioTab />
          </Suspense>
        </TabsContent>

        {/* Content Studio */}
        <TabsContent value="studio" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <ContentGenerationStudioTab />
          </Suspense>
        </TabsContent>

        {/* Content Audit */}
        <TabsContent value="audit" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <ContentAuditBotTab />
          </Suspense>
        </TabsContent>

        {/* Free Tools Management */}
        <TabsContent value="tools" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <ToolsManagementTab />
          </Suspense>
        </TabsContent>


        {/* Advanced (Phase 3 full) */}
        <TabsContent value="advanced" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <Phase3SprintHubTab />
          </Suspense>
        </TabsContent>

        {/* Optimization (Phase 4) */}
        <TabsContent value="optimization" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <Phase4SprintHubTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
