'use client';
import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Fingerprint, Scan, AlertTriangle, CheckCircle, XCircle, Shield,
  Loader2, Eye, BarChart3, Target, Brain, FileWarning,
  Copy, Globe, ChevronRight, ChevronLeft, Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

const PAGE_TYPES = [
  { value: 'all', label: 'All Pages' },
  { value: 'state', label: 'State Pages' },
  { value: 'city', label: 'City Pages' },
  { value: 'service', label: 'Service Pages' },
  { value: 'service_location', label: 'Service-Location' },
  { value: 'clinic', label: 'Clinic Pages' },
  { value: 'insurance', label: 'Insurance Pages' },
];

const issueColors: Record<string, string> = {
  'Duplicate Content': 'bg-red-500',
  'Duplicate Structure': 'bg-orange-500',
  'Duplicate Metadata': 'bg-amber-500',
  'Intent Conflict': 'bg-purple-500',
  'Thin Value Page': 'bg-rose-500',
  'AI-Sounding Content': 'bg-pink-500',
  'Low Local Authenticity': 'bg-yellow-600',
};

const priorityConfig = {
  critical: { label: 'Critical', color: 'bg-red-500 text-white', textColor: 'text-red-500' },
  high: { label: 'High', color: 'bg-orange-500 text-white', textColor: 'text-orange-500' },
  medium: { label: 'Medium', color: 'bg-amber-500 text-white', textColor: 'text-amber-500' },
  none: { label: 'Good', color: 'bg-green-500 text-white', textColor: 'text-green-500' },
};

export default function PageIdentityReportTab() {
  const [pageType, setPageType] = useState('all');
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('report');
  const [scanOffset, setScanOffset] = useState(0);
  const [fixingPageId, setFixingPageId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const BATCH_SIZE = 50;

  // Run identity scan with pagination
  const scanMutation = useMutation({
    mutationFn: async (offset: number = 0) => {
      const { data, error } = await supabase.functions.invoke('page-identity-scan', {
        body: { action: 'run_identity_scan', page_type: pageType, limit: BATCH_SIZE, offset },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Scan failed');
      return data;
    },
    onSuccess: (data) => {
      const msg = `Scanned ${data.summary.total_scanned} pages (batch ${Math.floor(scanOffset / BATCH_SIZE) + 1}). Found ${data.summary.duplicate_content} duplicates, ${data.summary.thin_value} thin pages.`;
      toast.success(msg);
      if (data.summary.has_more) {
        toast.info(`${data.summary.total_pages - scanOffset - BATCH_SIZE} more pages remaining. Click "Scan Next Batch" to continue.`);
      }
    },
    onError: (e) => toast.error(`Scan failed: ${e.message}`),
  });

  // Boilerplate clusters
  const clusterMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('page-identity-scan', {
        body: { action: 'find_boilerplate_clusters', limit: 200 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => toast.success(`Found ${data.total_clusters} boilerplate clusters`),
    onError: (e) => toast.error(`Cluster scan failed: ${e.message}`),
  });

  const startScan = (offset: number = 0) => {
    setScanOffset(offset);
    scanMutation.mutate(offset);
  };

  // Fix page content via AI rewrite
  const fixPageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      setFixingPageId(pageId);
      const { data, error } = await supabase.functions.invoke('seo-bulk-processor', {
        body: {
          action: 'process_job',
          job_id: crypto.randomUUID(),
          page_ids: [pageId],
          config: {
            regenerateH1: true,
            regenerateH2: true,
            regenerateMetaTitle: true,
            regenerateMetaDescription: true,
            regenerateIntro: true,
            regenerateSections: true,
            regenerateFaq: true,
            addInternalLinks: false,
            rewriteForUniqueness: true,
            expandContent: true,
            targetWordCount: 800,
          },
          apply_mode: 'auto_apply',
          quality_threshold: 50,
          custom_prompt: 'Rewrite to be completely unique, human-sounding, locally relevant to UAE/Dubai. Remove AI patterns, add specific details, pricing ranges in AED, neighborhood references, and practical patient guidance.',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setFixingPageId(null);
      if (data?.successful > 0) {
        toast.success('Page content fixed and rewritten by AI!');
        // Re-scan to update scores
        startScan(scanOffset);
      } else {
        toast.error('Fix attempted but failed. Check the page content.');
      }
    },
    onError: (e) => {
      setFixingPageId(null);
      toast.error(`Fix failed: ${e.message}`);
    },
  });

  // Bulk fix multiple pages
  const bulkFixMutation = useMutation({
    mutationFn: async (pageIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('seo-bulk-processor', {
        body: {
          action: 'process_job',
          job_id: crypto.randomUUID(),
          page_ids: pageIds,
          config: {
            regenerateH1: true, regenerateH2: true, regenerateMetaTitle: true,
            regenerateMetaDescription: true, regenerateIntro: true, regenerateSections: true,
            regenerateFaq: true, addInternalLinks: false, rewriteForUniqueness: true,
            expandContent: true, targetWordCount: 800,
          },
          apply_mode: 'auto_apply',
          quality_threshold: 50,
          custom_prompt: 'Rewrite to be completely unique, human-sounding, locally relevant to UAE/Dubai. Remove AI patterns, add specific details, pricing ranges in AED, neighborhood references, and practical patient guidance.',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSelectedIds(new Set());
      toast.success(`Bulk fix completed! ${data?.successful || 0} pages fixed.`);
      startScan(scanOffset);
    },
    onError: (e) => toast.error(`Bulk fix failed: ${e.message}`),
  });

  const toggleSelectAll = (data: any[]) => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((r: any) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const results = scanMutation.data?.results || [];
  const summary = scanMutation.data?.summary;
  const clusters = clusterMutation.data?.clusters || [];

  const filteredResults = useMemo(() => {
    if (activeTab === 'duplicates') return results.filter((r: any) => r.issues.includes('Duplicate Content') || r.issues.includes('Duplicate Metadata'));
    if (activeTab === 'thin') return results.filter((r: any) => r.issues.includes('Thin Value Page'));
    if (activeTab === 'ai') return results.filter((r: any) => r.ai_sounding_score >= 50);
    if (activeTab === 'noindex') return results.filter((r: any) => !r.is_index_worthy);
    return results;
  }, [results, activeTab]);

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/10 via-primary/10 to-teal/10 p-6 border border-primary/20">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
                <Fingerprint className="h-5 w-5 text-white" />
              </div>
              Page Identity Report
            </h1>
            <p className="text-muted-foreground mt-1">
              Full-site similarity audit — text, structure, metadata, and intent analysis
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={pageType} onValueChange={setPageType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => startScan(0)}
              disabled={scanMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-primary"
            >
              {scanMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
              ) : (
                <><Scan className="h-4 w-4 mr-2" />Run Scan (Batch 1)</>
              )}
            </Button>
            {summary?.has_more && (
              <Button
                onClick={() => startScan(scanOffset + BATCH_SIZE)}
                disabled={scanMutation.isPending}
                variant="outline"
              >
                {scanMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                Scan Next Batch
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Scanned', value: summary.total_scanned, icon: BarChart3, color: 'text-primary' },
              { label: 'Duplicate Content', value: summary.duplicate_content, icon: Copy, color: 'text-red-500' },
              { label: 'Duplicate Meta', value: summary.duplicate_metadata, icon: FileWarning, color: 'text-amber-500' },
              { label: 'Intent Conflicts', value: summary.intent_conflicts, icon: Target, color: 'text-purple-500' },
              { label: 'Thin Value', value: summary.thin_value, icon: AlertTriangle, color: 'text-rose-500' },
              { label: 'Not Indexable', value: summary.not_index_worthy, icon: XCircle, color: 'text-red-600' },
            ].map(s => (
              <Card key={s.label} className="bg-card/50">
                <CardContent className="pt-4 pb-3 px-3">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>Showing batch: pages {scanOffset + 1} – {scanOffset + summary.total_scanned} of {summary.total_pages} total</span>
            {summary.has_more && <span className="text-primary font-medium">More pages available →</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Identity Score</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={summary.avg_identity_score} className="flex-1" />
                  <span className={`text-lg font-bold ${scoreColor(summary.avg_identity_score)}`}>{summary.avg_identity_score}%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Avg Page Value</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={summary.avg_value_score} className="flex-1" />
                  <span className={`text-lg font-bold ${scoreColor(summary.avg_value_score)}`}>{summary.avg_value_score}%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Rewrite Queue</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2 text-sm">
                  <Badge className="bg-red-500">{summary.critical_rewrites} Critical</Badge>
                  <Badge className="bg-orange-500">{summary.high_rewrites} High</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Filter Tabs & Results */}
      {results.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-border" style={{ WebkitOverflowScrolling: 'touch' }}>
            <TabsList className="inline-flex w-max h-10 p-1 gap-0.5">
              <TabsTrigger value="report" className="text-xs gap-1 whitespace-nowrap">
                <BarChart3 className="h-3 w-3" /> All ({results.length})
              </TabsTrigger>
              <TabsTrigger value="duplicates" className="text-xs gap-1 whitespace-nowrap">
                <Copy className="h-3 w-3" /> Duplicates
              </TabsTrigger>
              <TabsTrigger value="thin" className="text-xs gap-1 whitespace-nowrap">
                <AlertTriangle className="h-3 w-3" /> Thin Value
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs gap-1 whitespace-nowrap">
                <Brain className="h-3 w-3" /> AI-Sounding
              </TabsTrigger>
              <TabsTrigger value="noindex" className="text-xs gap-1 whitespace-nowrap">
                <XCircle className="h-3 w-3" /> Not Indexable
              </TabsTrigger>
              <TabsTrigger value="clusters" className="text-xs gap-1 whitespace-nowrap">
                <Globe className="h-3 w-3" /> Boilerplate
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            {activeTab === 'clusters' ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Boilerplate Clusters
                      </CardTitle>
                      <CardDescription>Groups of pages sharing identical paragraph blocks</CardDescription>
                    </div>
                    <Button onClick={() => clusterMutation.mutate()} disabled={clusterMutation.isPending} variant="outline">
                      {clusterMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scan className="h-4 w-4 mr-2" />}
                      Scan Clusters
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {clusters.length > 0 ? (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {clusters.map((cluster: any, i: number) => (
                          <div key={i} className="p-4 border rounded-xl bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{cluster.page_count} pages share this block</Badge>
                              <Badge className="bg-amber-500">Cluster #{i + 1}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {cluster.pages.map((slug: string) => (
                                <code key={slug} className="text-xs bg-muted px-1.5 py-0.5 rounded">/{slug}</code>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Click "Scan Clusters" to detect boilerplate patterns</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-lg">
                      {filteredResults.length} Pages {activeTab !== 'report' && `(filtered)`}
                    </CardTitle>
                    {selectedIds.size > 0 && (
                      <Button
                        size="sm"
                        onClick={() => bulkFixMutation.mutate(Array.from(selectedIds))}
                        disabled={bulkFixMutation.isPending}
                        className="bg-gradient-to-r from-violet-500 to-primary gap-2"
                      >
                        {bulkFixMutation.isPending ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Fixing {selectedIds.size}...</>
                        ) : (
                          <><Wrench className="h-3 w-3" /> Fix All Selected ({selectedIds.size})</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={filteredResults.length > 0 && selectedIds.size === filteredResults.length}
                              onCheckedChange={() => toggleSelectAll(filteredResults)}
                            />
                          </TableHead>
                          <TableHead className="font-bold">Page URL</TableHead>
                          <TableHead className="font-bold text-center">Type</TableHead>
                          <TableHead className="font-bold text-center">Identity</TableHead>
                          <TableHead className="font-bold text-center">Value</TableHead>
                          <TableHead className="font-bold text-center">AI Score</TableHead>
                          <TableHead className="font-bold text-center">Similar %</TableHead>
                          <TableHead className="font-bold">Issues</TableHead>
                          <TableHead className="font-bold text-center">Priority</TableHead>
                          <TableHead className="text-center">Index</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResults.map((r: any) => {
                          const pri = priorityConfig[r.rewrite_priority as keyof typeof priorityConfig] || priorityConfig.none;
                          return (
                            <TableRow key={r.id} className="hover:bg-muted/30">
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(r.id)}
                                  onCheckedChange={() => toggleSelect(r.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-1 py-0.5 rounded block max-w-[200px] truncate">/{r.slug}</code>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">{r.page_type}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-bold ${scoreColor(r.identity_score)}`}>{r.identity_score}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-bold ${scoreColor(r.page_value_score)}`}>{r.page_value_score}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={r.ai_sounding_score >= 50 ? 'text-pink-500 font-bold' : 'text-muted-foreground'}>
                                  {r.ai_sounding_score}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={r.max_text_similarity >= 65 ? 'text-red-500 font-bold' : 'text-muted-foreground'}>
                                  {r.max_text_similarity}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {r.issues.slice(0, 2).map((issue: string) => (
                                    <Badge key={issue} className={`text-[10px] px-1 py-0 text-white ${issueColors[issue] || 'bg-gray-500'}`}>
                                      {issue.replace('Duplicate ', 'Dup ').replace('Content', 'Cont')}
                                    </Badge>
                                  ))}
                                  {r.issues.length > 2 && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">+{r.issues.length - 2}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`text-[10px] ${pri.color}`}>{pri.label}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {r.is_index_worthy ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {r.issues.length > 0 && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                      onClick={() => fixPageMutation.mutate(r.id)}
                                      disabled={fixPageMutation.isPending && fixingPageId === r.id}
                                    >
                                      {fixPageMutation.isPending && fixingPageId === r.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Wrench className="h-3 w-3" />
                                      )}
                                      Fix
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" onClick={() => setSelectedPage(r)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty state */}
      {!scanMutation.isPending && results.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Fingerprint className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Scan Results Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Run Scan" to analyze your pages for duplicate content, AI-sounding text, thin value, and structural similarity.
              Pages are scanned in batches of {BATCH_SIZE} to ensure reliable results.
            </p>
            <Button onClick={() => startScan(0)} disabled={scanMutation.isPending} variant="outline">
              {scanMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Scan className="h-4 w-4 mr-2" />}
              Start Full Scan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedPage} onOpenChange={() => setSelectedPage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              Page Identity Details
            </DialogTitle>
            <DialogDescription>
              <code className="text-sm">/{selectedPage?.slug}</code>
            </DialogDescription>
          </DialogHeader>

          {selectedPage && (
            <div className="space-y-4">
              {/* Fix Button */}
              {selectedPage.issues?.length > 0 && (
                <Button
                  onClick={() => { fixPageMutation.mutate(selectedPage.id); setSelectedPage(null); }}
                  disabled={fixPageMutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-purple hover:opacity-90 gap-2"
                >
                  {fixPageMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Fixing...</>
                  ) : (
                    <><Wrench className="h-4 w-4" /> Fix All Issues with AI</>
                  )}
                </Button>
              )}
              {/* Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Identity', value: selectedPage.identity_score, color: scoreColor(selectedPage.identity_score) },
                  { label: 'Value', value: selectedPage.page_value_score, color: scoreColor(selectedPage.page_value_score) },
                  { label: 'AI Score', value: selectedPage.ai_sounding_score, color: selectedPage.ai_sounding_score >= 50 ? 'text-pink-500' : 'text-green-500' },
                  { label: 'Local Auth.', value: selectedPage.local_authenticity_score, color: scoreColor(selectedPage.local_authenticity_score) },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl border bg-muted/20">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Issues */}
              {selectedPage.issues.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Issues Detected</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPage.issues.map((issue: string) => (
                      <Badge key={issue} className={`text-white ${issueColors[issue] || 'bg-gray-500'}`}>{issue}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Flags */}
              {selectedPage.ai_flags?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">AI Detection Flags</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedPage.ai_flags.map((flag: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-pink-500" /> {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Similar Pages */}
              {selectedPage.similar_pages?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Most Similar Pages</h4>
                  <div className="space-y-2">
                    {selectedPage.similar_pages.map((sp: any) => (
                      <div key={sp.slug} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                        <code className="text-xs">/{sp.slug}</code>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">Text: {Math.round(sp.textSim * 100)}%</Badge>
                          <Badge variant="outline" className="text-xs">Struct: {Math.round(sp.structSim * 100)}%</Badge>
                          {sp.metaSim && <Badge className="bg-amber-500 text-white text-xs">Same Meta</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
