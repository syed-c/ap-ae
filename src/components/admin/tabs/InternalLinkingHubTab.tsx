'use client';
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Link2, Search, BarChart3, AlertCircle, CheckCircle, 
  RefreshCw, Loader2, ArrowRight, Globe, FileText, 
  MapPin, Stethoscope, BookOpen, ExternalLink, Zap,
  Activity, Target, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkAuditResult {
  page_slug: string;
  page_type: string;
  outbound_links: number;
  inbound_links: number;
  orphan: boolean;
  has_parent_link: boolean;
  has_child_links: boolean;
  has_lateral_links: boolean;
  score: number;
}

export default function InternalLinkingHubTab() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [auditResults, setAuditResults] = useState<LinkAuditResult[]>([]);

  // Fetch page counts for overview
  const { data: pageStats } = useQuery({
    queryKey: ['linking-page-stats'],
    queryFn: async () => {
      const [
        { count: seoPages },
        { count: blogPosts },
        { count: treatmentPages },
        { count: cityPages },
        { count: areaPages },
      ] = await Promise.all([
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('page_type', 'treatment'),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('page_type', 'city'),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('page_type', 'neighborhood'),
      ]);
      return {
        seoPages: seoPages || 0,
        blogPosts: blogPosts || 0,
        treatmentPages: treatmentPages || 0,
        cityPages: cityPages || 0,
        areaPages: areaPages || 0,
        totalPages: (seoPages || 0) + (blogPosts || 0),
      };
    },
  });

  // Run linking audit
  const runLinkingAudit = async () => {
    setIsAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-brain-audit', {
        body: { action: 'linking-audit' },
      });

      if (error) throw error;

      if (data?.results) {
        setAuditResults(data.results);
        toast.success(`Audit complete! ${data.results.length} pages analyzed.`);
      }
    } catch (err) {
      toast.error(`Audit failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Fix internal linking
  const fixInternalLinks = async (scope: 'orphans' | 'all') => {
    setIsFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-brain-audit', {
        body: { action: 'fix-internal-links', scope },
      });

      if (error) throw error;

      toast.success(`Fixed internal links for ${data?.fixed || 0} pages!`);
      // Re-run audit to see updated results
      await runLinkingAudit();
    } catch (err) {
      toast.error(`Fix failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsFixing(false);
    }
  };

  // Computed stats
  const auditStats = useMemo(() => {
    if (auditResults.length === 0) return null;
    const orphans = auditResults.filter(r => r.orphan).length;
    const wellLinked = auditResults.filter(r => r.score >= 80).length;
    const poor = auditResults.filter(r => r.score < 40).length;
    const avgScore = Math.round(auditResults.reduce((sum, r) => sum + r.score, 0) / auditResults.length);
    return { orphans, wellLinked, poor, avgScore, total: auditResults.length };
  }, [auditResults]);

  const filteredResults = useMemo(() => {
    return auditResults.filter(r => {
      if (filterType !== 'all' && r.page_type !== filterType) return false;
      if (searchQuery && !r.page_slug.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [auditResults, filterType, searchQuery]);

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500/20 text-green-400">{score}%</Badge>;
    if (score >= 50) return <Badge className="bg-amber-500/20 text-amber-400">{score}%</Badge>;
    return <Badge className="bg-red-500/20 text-red-400">{score}%</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal/10 via-primary/10 to-purple/10 p-6 border border-teal/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-teal blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-primary blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal to-primary flex items-center justify-center">
                <Link2 className="h-6 w-6 text-white" />
              </div>
              Internal Linking Hub
            </h1>
            <p className="text-muted-foreground mt-2">
              Audit, visualize, and auto-fix internal link structures for maximum SEO impact
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['linking-page-stats'] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Pages', value: pageStats?.totalPages || 0, icon: Globe, color: 'text-primary' },
          { label: 'SEO Pages', value: pageStats?.seoPages || 0, icon: FileText, color: 'text-teal' },
          { label: 'Blog Posts', value: pageStats?.blogPosts || 0, icon: BookOpen, color: 'text-purple' },
          { label: 'Services', value: pageStats?.treatmentPages || 0, icon: Stethoscope, color: 'text-gold' },
          { label: 'Locations', value: pageStats?.cityPages || 0, icon: MapPin, color: 'text-coral' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 max-w-xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="orphans" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Orphan Pages
          </TabsTrigger>
          <TabsTrigger value="autofix" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Auto-Fix
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Linking Strategy
                </CardTitle>
                <CardDescription>How internal linking works on this platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-primary">
                    <p className="font-medium">Parent Links</p>
                    <p className="text-muted-foreground text-xs">Every page links to its parent (e.g., Area → City → Emirate → Home)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-teal">
                    <p className="font-medium">Child Links</p>
                    <p className="text-muted-foreground text-xs">Pages link to their children (e.g., City → Areas within it)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-purple">
                    <p className="font-medium">Lateral Links</p>
                    <p className="text-muted-foreground text-xs">Pages link to 2+ related siblings (e.g., Teeth Whitening → Veneers, Dental Crowns)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-gold">
                    <p className="font-medium">Contextual Blocks</p>
                    <p className="text-muted-foreground text-xs">"Popular Treatments", "Nearby Areas", "Accepted Insurance" with natural anchor text</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal" />
                  Linking Health
                </CardTitle>
                <CardDescription>Current internal linking status</CardDescription>
              </CardHeader>
              <CardContent>
                {auditStats ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Link Score</span>
                        <span className="font-bold">{auditStats.avgScore}%</span>
                      </div>
                      <Progress value={auditStats.avgScore} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                        <p className="text-2xl font-bold text-green-400">{auditStats.wellLinked}</p>
                        <p className="text-xs text-muted-foreground">Well Linked</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                        <p className="text-2xl font-bold text-red-400">{auditStats.orphans}</p>
                        <p className="text-xs text-muted-foreground">Orphan Pages</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Link2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">Run an audit to see linking health</p>
                    <Button onClick={runLinkingAudit} disabled={isAuditing} variant="outline" size="sm">
                      {isAuditing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      Run Audit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Results */}
        <TabsContent value="audit" className="mt-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button onClick={runLinkingAudit} disabled={isAuditing}>
                {isAuditing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                {isAuditing ? 'Auditing...' : 'Run Link Audit'}
              </Button>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="treatment">Services</SelectItem>
                  <SelectItem value="city">Cities</SelectItem>
                  <SelectItem value="neighborhood">Areas</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Badge variant="outline">{filteredResults.length} pages</Badge>
          </div>

          {filteredResults.length > 0 ? (
            <Card>
              <CardContent className="pt-4">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Outbound</TableHead>
                        <TableHead className="text-center">Inbound</TableHead>
                        <TableHead className="text-center">Parent</TableHead>
                        <TableHead className="text-center">Children</TableHead>
                        <TableHead className="text-center">Lateral</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result, i) => (
                        <TableRow key={i} className={result.orphan ? 'bg-red-500/5' : ''}>
                          <TableCell className="font-medium max-w-[250px] truncate">
                            /{result.page_slug}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{result.page_type}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{result.outbound_links}</TableCell>
                          <TableCell className="text-center">{result.inbound_links}</TableCell>
                          <TableCell className="text-center">
                            {result.has_parent_link ? <CheckCircle className="h-4 w-4 text-green-400 mx-auto" /> : <AlertCircle className="h-4 w-4 text-red-400 mx-auto" />}
                          </TableCell>
                          <TableCell className="text-center">
                            {result.has_child_links ? <CheckCircle className="h-4 w-4 text-green-400 mx-auto" /> : <AlertCircle className="h-4 w-4 text-muted-foreground mx-auto" />}
                          </TableCell>
                          <TableCell className="text-center">
                            {result.has_lateral_links ? <CheckCircle className="h-4 w-4 text-green-400 mx-auto" /> : <AlertCircle className="h-4 w-4 text-red-400 mx-auto" />}
                          </TableCell>
                          <TableCell className="text-center">{getScoreBadge(result.score)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Link2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Audit Results</h3>
                <p className="text-muted-foreground">Run a link audit to see the internal linking structure of all pages.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orphan Pages */}
        <TabsContent value="orphans" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-coral" />
                Orphan Pages
              </CardTitle>
              <CardDescription>
                Pages with no inbound links from other pages on the site. These are invisible to search engines 
                unless they're in the sitemap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditResults.filter(r => r.orphan).length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {auditResults.filter(r => r.orphan).map((result, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-coral/20 bg-coral/5">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-4 w-4 text-coral" />
                          <div>
                            <p className="font-medium text-sm">/{result.page_slug}</p>
                            <p className="text-xs text-muted-foreground">{result.page_type} • {result.outbound_links} outbound links</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-coral border-coral/50">Orphan</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {auditResults.length > 0 ? 'No orphan pages found! All pages have inbound links.' : 'Run an audit first to detect orphan pages.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Fix */}
        <TabsContent value="autofix" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-teal/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-teal" />
                  Fix Orphan Pages
                </CardTitle>
                <CardDescription>
                  Add contextual internal links to orphan pages using AI-generated anchor text. 
                  Links are inserted into relevant content blocks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => fixInternalLinks('orphans')} 
                  disabled={isFixing}
                  className="w-full bg-gradient-to-r from-teal to-primary hover:opacity-90"
                >
                  {isFixing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                  Fix Orphan Pages
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-purple" />
                  Full Link Optimization
                </CardTitle>
                <CardDescription>
                  Analyze all pages and add missing parent, child, and lateral links.
                  Ensures every page follows the linking strategy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => fixInternalLinks('all')} 
                  disabled={isFixing}
                  className="w-full bg-gradient-to-r from-purple to-primary hover:opacity-90"
                >
                  {isFixing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                  Optimize All Links
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>How Auto-Fix Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">1</div>
                    <span className="font-medium text-sm">Detect</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scans all SEO pages, blog posts, and location pages to map the link graph and identify gaps.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-teal/20 flex items-center justify-center text-teal font-bold text-sm">2</div>
                    <span className="font-medium text-sm">Generate</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI generates natural anchor text and identifies the best insertion points within existing content.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-purple/20 flex items-center justify-center text-purple font-bold text-sm">3</div>
                    <span className="font-medium text-sm">Insert</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Links are injected into "Related Services", "Nearby Areas", and inline content sections automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
