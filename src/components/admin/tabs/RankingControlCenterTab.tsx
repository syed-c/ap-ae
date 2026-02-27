'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, Globe, MapPin, Shield, Sparkles, 
  TrendingUp, AlertTriangle, CheckCircle, Target,
  FileText, Link2, Building, RefreshCw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Score Badge Helper ───
function ScoreBadge({ score, label }: { score: number; label?: string }) {
  const color = score >= 80 ? 'bg-teal/20 text-teal border-teal/30' 
    : score >= 50 ? 'bg-gold/20 text-gold border-gold/30' 
    : 'bg-destructive/20 text-destructive border-destructive/30';
  return (
    <Badge className={color}>
      {label ? `${label}: ` : ''}{Math.round(score)}%
    </Badge>
  );
}

// ─── Gauge Card ───
function GaugeCard({ title, score, icon: Icon, subtitle, benchmark }: {
  title: string; score: number; icon: any; subtitle: string; benchmark?: number;
}) {
  const color = score >= 80 ? 'text-teal' : score >= 50 ? 'text-gold' : 'text-destructive';
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <span className={`text-3xl font-display font-black ${color}`}>{Math.round(score)}%</span>
        </div>
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        <Progress value={score} className="mt-3 h-2" />
        {benchmark !== undefined && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Benchmark target: {benchmark}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Hook: Fetch all ranking data ───
function useRankingData() {
  // Entity graph health
  const clinics = useQuery({
    queryKey: ['ranking-clinics-health'],
    queryFn: async () => {
      const { count: total } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true);
      const { count: withCity } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true).not('city_id', 'is', null);
      const { count: withArea } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true).not('area_id', 'is', null);
      const { count: withPhone } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true).not('phone', 'is', null);
      const { count: withDesc } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true).not('description', 'is', null);
      const { count: verified } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified');
      const { count: claimed } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('claim_status', 'claimed');
      const { count: featured } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_featured', true);
      return { total: total || 0, withCity: withCity || 0, withArea: withArea || 0, withPhone: withPhone || 0, withDesc: withDesc || 0, verified: verified || 0, claimed: claimed || 0, featured: featured || 0 };
    },
  });

  const treatments = useQuery({
    queryKey: ['ranking-treatments-count'],
    queryFn: async () => {
      const { count } = await supabase.from('treatments').select('*', { count: 'exact', head: true }).eq('is_active', true);
      const { count: linked } = await supabase.from('clinic_treatments').select('*', { count: 'exact', head: true });
      return { total: count || 0, linked: linked || 0 };
    },
  });

  const locations = useQuery({
    queryKey: ['ranking-locations'],
    queryFn: async () => {
      const { data: states } = await supabase.from('states').select('id, name, slug, abbreviation, clinic_count, is_active').order('name');
      const { data: cities } = await supabase.from('cities').select('id, name, slug, state_id, dentist_count, is_active, seo_status').order('name');
      const { count: areaCount } = await supabase.from('areas').select('*', { count: 'exact', head: true }).eq('is_active', true);
      return { states: states || [], cities: cities || [], areaCount: areaCount || 0 };
    },
  });

  const seoPages = useQuery({
    queryKey: ['ranking-seo-pages'],
    queryFn: async () => {
      const { data, count } = await supabase.from('seo_pages').select('page_type, is_published, is_indexed, is_thin_content, is_duplicate, meta_title, meta_description, h1, content', { count: 'exact' }).limit(5000);
      return { pages: data || [], total: count || 0 };
    },
  });

  const insurances = useQuery({
    queryKey: ['ranking-insurances'],
    queryFn: async () => {
      const { count } = await supabase.from('insurances').select('*', { count: 'exact', head: true }).eq('is_active', true);
      const { count: linked } = await supabase.from('clinic_insurances').select('*', { count: 'exact', head: true });
      return { total: count || 0, linked: linked || 0 };
    },
  });

  const reviews = useQuery({
    queryKey: ['ranking-reviews'],
    queryFn: async () => {
      const { count: total } = await supabase.from('internal_reviews').select('*', { count: 'exact', head: true });
      const { count: approved } = await supabase.from('internal_reviews').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      return { total: total || 0, approved: approved || 0 };
    },
  });

  const dentists = useQuery({
    queryKey: ['ranking-dentists'],
    queryFn: async () => {
      const { count } = await supabase.from('dentists').select('*', { count: 'exact', head: true }).eq('is_active', true);
      return { total: count || 0 };
    },
  });

  return { clinics, treatments, locations, seoPages, insurances, reviews, dentists };
}

// ─── Compute Scores ───
function computeScores(data: ReturnType<typeof useRankingData>) {
  const c = data.clinics.data;
  const t = data.treatments.data;
  const l = data.locations.data;
  const s = data.seoPages.data;
  const ins = data.insurances.data;
  const r = data.reviews.data;
  const _d = data.dentists.data;

  // 1. Entity Graph Health
  const entityFactors = c ? [
    c.total > 0 ? (c.withCity / c.total) * 100 : 0,
    c.total > 0 ? (c.withArea / c.total) * 100 : 0,
    c.total > 0 ? (c.withPhone / c.total) * 100 : 0,
    c.total > 0 ? (c.withDesc / c.total) * 100 : 0,
    t ? (t.linked > 0 ? Math.min(100, (t.linked / Math.max(1, c.total)) * 20) : 0) : 0,
    ins ? (ins.linked > 0 ? Math.min(100, (ins.linked / Math.max(1, c.total)) * 20) : 0) : 0,
  ] : [0];
  const entityHealth = entityFactors.reduce((a, b) => a + b, 0) / entityFactors.length;

  // 2. Schema Coverage - based on page types with structured data potential
  const schemaScore = s ? (() => {
    const total = s.total;
    if (total === 0) return 0;
    const withMeta = s.pages.filter(p => p.meta_title && p.meta_description).length;
    return (withMeta / Math.max(1, s.pages.length)) * 100;
  })() : 0;

  // 3. Page Uniqueness
  const uniquenessScore = s ? (() => {
    if (s.pages.length === 0) return 100;
    const nonDuplicate = s.pages.filter(p => !p.is_duplicate).length;
    const nonThin = s.pages.filter(p => !p.is_thin_content).length;
    return ((nonDuplicate + nonThin) / (s.pages.length * 2)) * 100;
  })() : 0;

  // 4. Local Relevance (Dubai focus)
  const dubaiCities = l ? l.cities.filter(city => 
    city.name.toLowerCase().includes('dubai') || 
    l.states.find(st => st.id === city.state_id)?.name?.toLowerCase().includes('dubai')
  ) : [];
  const dubaiActive = dubaiCities.filter(c => c.is_active).length;
  const localScore = l ? Math.min(100, (dubaiActive / Math.max(1, 15)) * 100) : 0; // target: 15 Dubai areas

  // 5. Trust Signal Score
  const trustFactors = c ? [
    c.total > 0 ? (c.verified / c.total) * 100 : 0,
    c.total > 0 ? (c.claimed / c.total) * 100 : 0,
    r ? (r.approved > 0 ? Math.min(100, (r.approved / Math.max(1, c.total)) * 25) : 0) : 0,
  ] : [0];
  const trustScore = trustFactors.reduce((a, b) => a + b, 0) / trustFactors.length;

  // 6. Indexation Status
  const indexScore = s ? (() => {
    if (s.pages.length === 0) return 0;
    const indexed = s.pages.filter(p => p.is_indexed && p.is_published).length;
    return (indexed / s.pages.length) * 100;
  })() : 0;

  // 7. Internal linking strength (proxy: pages with H1 + content)
  const linkingScore = s ? (() => {
    if (s.pages.length === 0) return 0;
    const withH1 = s.pages.filter(p => p.h1).length;
    const withContent = s.pages.filter(p => p.content && p.content.length > 200).length;
    return ((withH1 + withContent) / (s.pages.length * 2)) * 100;
  })() : 0;

  // 8. Micro-location coverage
  const microLocationScore = l ? Math.min(100, ((l.areaCount) / 70) * 100) : 0; // target: 70 areas

  // Overall
  const overall = (entityHealth + schemaScore + uniquenessScore + localScore + trustScore + indexScore + linkingScore + microLocationScore) / 8;

  return {
    entityHealth, schemaScore, uniquenessScore, localScore,
    trustScore, indexScore, linkingScore, microLocationScore, overall,
  };
}

export default function RankingControlCenterTab() {
  const [activeSection, setActiveSection] = useState('overview');
  const data = useRankingData();
  const isLoading = Object.values(data).some(q => q.isLoading);
  const scores = useMemo(() => computeScores(data), [
    data.clinics.data, data.treatments.data, data.locations.data,
    data.seoPages.data, data.insurances.data, data.reviews.data, data.dentists.data,
  ]);

  const refetchAll = () => {
    Object.values(data).forEach(q => q.refetch());
    toast.success('Refreshing all ranking data...');
  };

  // Weak pages analysis
  const weakPages = useMemo(() => {
    const pages = data.seoPages.data?.pages || [];
    return pages
      .filter(p => p.is_thin_content || p.is_duplicate || !p.meta_title || !p.meta_description || !p.h1)
      .map(p => ({
        ...p,
        issues: [
          !p.meta_title && 'Missing title',
          !p.meta_description && 'Missing description',
          !p.h1 && 'Missing H1',
          p.is_thin_content && 'Thin content',
          p.is_duplicate && 'Duplicate content',
        ].filter(Boolean) as string[],
      }))
      .slice(0, 100);
  }, [data.seoPages.data]);

  // Dubai area breakdown
  const dubaiAreas = useMemo(() => {
    if (!data.locations.data) return [];
    const { states, cities } = data.locations.data;
    const dubaiState = states.find(s => s.name.toLowerCase() === 'dubai');
    if (!dubaiState) return cities.filter(c => c.is_active);
    return cities.filter(c => c.state_id === dubaiState.id);
  }, [data.locations.data]);

  // SEO pages by type
  const pagesByType = useMemo(() => {
    const pages = data.seoPages.data?.pages || [];
    const groups: Record<string, { total: number; published: number; thin: number; duplicate: number }> = {};
    pages.forEach(p => {
      if (!groups[p.page_type]) groups[p.page_type] = { total: 0, published: 0, thin: 0, duplicate: 0 };
      groups[p.page_type].total++;
      if (p.is_published) groups[p.page_type].published++;
      if (p.is_thin_content) groups[p.page_type].thin++;
      if (p.is_duplicate) groups[p.page_type].duplicate++;
    });
    return groups;
  }, [data.seoPages.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-teal flex items-center justify-center shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Ranking Control Center</h1>
            <p className="text-muted-foreground text-sm">
              Real-time SEO health, entity coverage & Dubai micro-location analysis
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={refetchAll} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Overall Score Banner */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm font-medium">Overall Ranking Readiness</p>
              <p className="text-5xl font-display font-black mt-1">{Math.round(scores.overall)}%</p>
              <p className="text-white/50 text-xs mt-1">
                Based on 8 ranking factors • {data.clinics.data?.total || 0} clinics • {data.seoPages.data?.total || 0} SEO pages
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Entity', score: scores.entityHealth },
                { label: 'Schema', score: scores.schemaScore },
                { label: 'Trust', score: scores.trustScore },
                { label: 'Index', score: scores.indexScore },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-2xl font-bold">{Math.round(item.score)}%</p>
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 8 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GaugeCard title="Entity Graph Health" score={scores.entityHealth} icon={Sparkles} subtitle="Clinic-location-service linking" benchmark={85} />
        <GaugeCard title="Schema Coverage" score={scores.schemaScore} icon={FileText} subtitle="Structured data on pages" benchmark={90} />
        <GaugeCard title="Page Uniqueness" score={scores.uniquenessScore} icon={Target} subtitle="Non-duplicate, non-thin pages" benchmark={95} />
        <GaugeCard title="Local Relevance" score={scores.localScore} icon={MapPin} subtitle="Dubai area coverage depth" benchmark={80} />
        <GaugeCard title="Trust Signals" score={scores.trustScore} icon={Shield} subtitle="Verified, claimed & reviewed" benchmark={70} />
        <GaugeCard title="Indexation Status" score={scores.indexScore} icon={Globe} subtitle="Published & indexed pages" benchmark={90} />
        <GaugeCard title="Internal Linking" score={scores.linkingScore} icon={Link2} subtitle="H1 + content depth" benchmark={80} />
        <GaugeCard title="Micro-Location Coverage" score={scores.microLocationScore} icon={Building} subtitle={`${data.locations.data?.areaCount || 0}/70 areas`} benchmark={90} />
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weak-pages">Weak Pages</TabsTrigger>
          <TabsTrigger value="dubai-map">Dubai Coverage</TabsTrigger>
          <TabsTrigger value="page-types">By Page Type</TabsTrigger>
          <TabsTrigger value="entity-detail">Entity Detail</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Clinics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Active</span><span className="font-bold">{data.clinics.data?.total || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Verified</span><span className="font-bold text-teal">{data.clinics.data?.verified || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Claimed</span><span className="font-bold">{data.clinics.data?.claimed || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Featured</span><span className="font-bold">{data.clinics.data?.featured || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">With Description</span><span className="font-bold">{data.clinics.data?.withDesc || 0}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">SEO Pages</span><span className="font-bold">{data.seoPages.data?.total || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Treatments</span><span className="font-bold">{data.treatments.data?.total || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dentists</span><span className="font-bold">{data.dentists.data?.total || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Insurances</span><span className="font-bold">{data.insurances.data?.total || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reviews</span><span className="font-bold">{data.reviews.data?.total || 0}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Emirates</span><span className="font-bold">{data.locations.data?.states.filter(s => s.is_active).length || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cities/Areas</span><span className="font-bold">{data.locations.data?.cities.filter(c => c.is_active).length || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sub-Areas</span><span className="font-bold">{data.locations.data?.areaCount || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dubai Areas</span><span className="font-bold text-primary">{dubaiAreas.length}</span></div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Roadmap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Priority Roadmap
              </CardTitle>
              <CardDescription>Actions sorted by ranking impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'Fix thin/duplicate SEO pages', impact: 'Critical', score: scores.uniquenessScore, target: 95 },
                  { action: 'Increase schema coverage on all pages', impact: 'High', score: scores.schemaScore, target: 90 },
                  { action: 'Get more clinics verified & claimed', impact: 'High', score: scores.trustScore, target: 70 },
                  { action: 'Expand Dubai micro-location areas', impact: 'High', score: scores.localScore, target: 80 },
                  { action: 'Strengthen internal linking depth', impact: 'Medium', score: scores.linkingScore, target: 80 },
                  { action: 'Complete clinic entity data (phone, desc)', impact: 'Medium', score: scores.entityHealth, target: 85 },
                  { action: 'Publish & index more SEO pages', impact: 'Medium', score: scores.indexScore, target: 90 },
                ].sort((a, b) => a.score - b.score).map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={item.score} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{Math.round(item.score)}% → {item.target}%</span>
                      </div>
                    </div>
                    <Badge variant={item.impact === 'Critical' ? 'destructive' : item.impact === 'High' ? 'default' : 'outline'} className="text-[10px]">
                      {item.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weak Pages */}
        <TabsContent value="weak-pages">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Pages Needing Attention ({weakPages.length})
              </CardTitle>
              <CardDescription>Pages missing critical SEO elements or flagged as thin/duplicate</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page Type</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weakPages.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-teal" />
                        No weak pages detected
                      </TableCell></TableRow>
                    ) : weakPages.map((page, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{page.page_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {page.issues.map((issue, j) => (
                              <Badge key={j} variant="destructive" className="text-[10px]">{issue}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {page.is_published ? <Badge className="bg-teal/20 text-teal text-[10px]">Published</Badge> : <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dubai Coverage Map */}
        <TabsContent value="dubai-map">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Dubai Micro-Location Coverage
              </CardTitle>
              <CardDescription>Area-level depth for Dubai search dominance</CardDescription>
            </CardHeader>
            <CardContent>
              {dubaiAreas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3" />
                  <p>No Dubai areas found. Check that Dubai emirate and its areas are configured in Locations.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {dubaiAreas.map(area => {
                    const clinicCount = area.dentist_count || 0;
                    const strength = clinicCount >= 20 ? 'strong' : clinicCount >= 5 ? 'moderate' : 'weak';
                    const colors = {
                      strong: 'border-teal/40 bg-teal/5',
                      moderate: 'border-gold/40 bg-gold/5',
                      weak: 'border-destructive/40 bg-destructive/5',
                    };
                    return (
                      <div key={area.id} className={`p-3 rounded-lg border-2 ${colors[strength]}`}>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold">{area.name}</h4>
                          <Badge variant={strength === 'strong' ? 'default' : strength === 'moderate' ? 'outline' : 'destructive'} className="text-[10px]">
                            {strength}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{clinicCount} clinics</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {!area.is_active && '⚠ Inactive'}
                          {area.seo_status === 'optimized' && '✓ SEO optimized'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Types Breakdown */}
        <TabsContent value="page-types">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                SEO Pages by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Published</TableHead>
                    <TableHead className="text-right">Thin</TableHead>
                    <TableHead className="text-right">Duplicate</TableHead>
                    <TableHead className="text-right">Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(pagesByType).map(([type, stats]) => {
                    const health = stats.total > 0 ? ((stats.total - stats.thin - stats.duplicate) / stats.total) * 100 : 100;
                    return (
                      <TableRow key={type}>
                        <TableCell className="font-medium">{type}</TableCell>
                        <TableCell className="text-right">{stats.total}</TableCell>
                        <TableCell className="text-right">{stats.published}</TableCell>
                        <TableCell className="text-right">{stats.thin > 0 ? <span className="text-destructive font-bold">{stats.thin}</span> : 0}</TableCell>
                        <TableCell className="text-right">{stats.duplicate > 0 ? <span className="text-destructive font-bold">{stats.duplicate}</span> : 0}</TableCell>
                        <TableCell className="text-right"><ScoreBadge score={health} /></TableCell>
                      </TableRow>
                    );
                  })}
                  {Object.keys(pagesByType).length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No SEO pages found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entity Detail */}
        <TabsContent value="entity-detail">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Clinic Entity Completeness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.clinics.data && [
                  { label: 'Has City', value: data.clinics.data.withCity, total: data.clinics.data.total },
                  { label: 'Has Area', value: data.clinics.data.withArea, total: data.clinics.data.total },
                  { label: 'Has Phone', value: data.clinics.data.withPhone, total: data.clinics.data.total },
                  { label: 'Has Description', value: data.clinics.data.withDesc, total: data.clinics.data.total },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground">{item.value}/{item.total}</span>
                    </div>
                    <Progress value={item.total > 0 ? (item.value / item.total) * 100 : 0} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Relationship Coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Clinic ↔ Treatment Links', value: data.treatments.data?.linked || 0, benchmark: 'Target: 5 per clinic' },
                  { label: 'Clinic ↔ Insurance Links', value: data.insurances.data?.linked || 0, benchmark: 'Target: 3 per clinic' },
                  { label: 'Approved Reviews', value: data.reviews.data?.approved || 0, benchmark: 'Target: 5 per clinic' },
                  { label: 'Active Dentist Profiles', value: data.dentists.data?.total || 0, benchmark: 'Target: 1 per clinic' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.benchmark}</p>
                    </div>
                    <span className="text-lg font-bold">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
