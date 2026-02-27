'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Heart, Brain, AlertTriangle, CheckCircle, XCircle,
  Loader2, RefreshCw, BarChart3, Target, Zap, Globe,
  Shield, Clock, Edit, RotateCcw, History, Scan, Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

const EDITORIAL_STATUSES = [
  { value: 'pending', label: 'Pending Review', color: 'bg-gray-500' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500' },
  { value: 'needs_rewrite', label: 'Needs Rewrite', color: 'bg-red-500' },
  { value: 'in_review', label: 'In Review', color: 'bg-amber-500' },
];

const PAGE_TYPES = [
  { value: 'all', label: 'All Pages' },
  { value: 'state', label: 'State Pages' },
  { value: 'city', label: 'City Pages' },
  { value: 'service', label: 'Service Pages' },
  { value: 'service_location', label: 'Service-Location' },
  { value: 'insurance', label: 'Insurance Pages' },
];

export default function HumanContentQualityTab() {
  const [activeTab, setActiveTab] = useState('overview');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [rollbackDialog, setRollbackDialog] = useState<{ pageId: string; slug: string } | null>(null);
  const [auditPageType, setAuditPageType] = useState('all');
  const [fixingPageId, setFixingPageId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

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
            regenerateH1: true, regenerateH2: true, regenerateMetaTitle: true,
            regenerateMetaDescription: true, regenerateIntro: true, regenerateSections: true,
            regenerateFaq: true, addInternalLinks: false, rewriteForUniqueness: true,
            expandContent: true, targetWordCount: 800,
          },
          apply_mode: 'auto_apply',
          quality_threshold: 50,
          custom_prompt: 'Rewrite to be completely unique, human-sounding, locally relevant to UAE/Dubai. Remove all AI patterns.',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setFixingPageId(null);
      toast.success('Page content fixed by AI!');
      refetch();
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
          custom_prompt: 'Rewrite to be completely unique, human-sounding, locally relevant to UAE/Dubai. Remove all AI patterns.',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSelectedIds(new Set());
      toast.success(`Bulk fix completed! ${data?.successful || 0} pages fixed.`);
      refetch();
    },
    onError: (e) => {
      toast.error(`Bulk fix failed: ${e.message}`);
    },
  });

  // Run quality audit (new - scans for AI content issues)
  const auditMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('page-identity-scan', {
        body: { action: 'run_quality_audit', page_type: auditPageType, limit: 50 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Audit failed');
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Audited ${data.total_scanned} pages. Found ${data.issues_found} pages with quality issues.`);
      refetch();
    },
    onError: (e) => toast.error(`Audit failed: ${e.message}`),
  });

  // Fetch quality report from stored scan data
  const { data: qualityData, isLoading, refetch } = useQuery({
    queryKey: ['human-quality-report', priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from('seo_pages')
        .select('id, slug, page_type, word_count, page_value_score, ai_sounding_score, local_authenticity_score, rewrite_priority, editorial_status, is_index_worthy, identity_score, last_identity_scan_at')
        .not('last_identity_scan_at', 'is', null)
        .order('page_value_score', { ascending: true });

      if (priorityFilter !== 'all') {
        query = query.eq('rewrite_priority', priorityFilter);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  // Summary stats
  const { data: summaryStats } = useQuery({
    queryKey: ['human-quality-summary'],
    queryFn: async () => {
      const [total, below60, aiHigh, lowLocal, critical, pending] = await Promise.all([
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('last_identity_scan_at', 'is', null),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('last_identity_scan_at', 'is', null).lt('page_value_score', 60),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('last_identity_scan_at', 'is', null).gte('ai_sounding_score', 50),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('last_identity_scan_at', 'is', null).lt('local_authenticity_score', 30),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('rewrite_priority', 'critical'),
        supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('editorial_status', 'pending').not('last_identity_scan_at', 'is', null),
      ]);
      return {
        total: total.count || 0,
        below60: below60.count || 0,
        aiHigh: aiHigh.count || 0,
        lowLocal: lowLocal.count || 0,
        critical: critical.count || 0,
        pending: pending.count || 0,
      };
    },
  });

  // Fetch content versions for rollback
  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['content-versions', rollbackDialog?.pageId],
    enabled: !!rollbackDialog?.pageId,
    queryFn: async (): Promise<any[]> => {
      const res = await supabase
        .from('seo_content_versions' as any)
        .select('*')
        .eq('page_id', rollbackDialog!.pageId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (res.error) throw res.error;
      return res.data || [];
    },
  });

  // Update editorial status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('seo_pages')
        .update({ editorial_status: status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast.success('Status updated');
    },
    onError: (e) => toast.error(`Update failed: ${e.message}`),
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const { data, error } = await supabase.functions.invoke('seo-bulk-processor', {
        body: { action: 'rollback_page', version_id: versionId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'Rollback failed');
      return data;
    },
    onSuccess: () => {
      toast.success('Content rolled back successfully');
      setRollbackDialog(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['content-versions'] });
    },
    onError: (e) => toast.error(`Rollback failed: ${e.message}`),
  });

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

  const scoreBar = (score: number) =>
    score >= 80 ? '[&>div]:bg-green-500' : score >= 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500';

  const pages = qualityData || [];
  const rewriteQueue = pages.filter(p => (p as any).rewrite_priority === 'critical' || (p as any).rewrite_priority === 'high');
  const aiSounding = pages.filter(p => (p as any).ai_sounding_score >= 50);
  const lowValue = pages.filter(p => (p as any).page_value_score < 60);

  // Also show audit results inline
  const auditResults = auditMutation.data?.results || [];

  const toggleSelectAll = (data: any[]) => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((p: any) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderTable = (data: any[]) => (
    <ScrollArea className="h-[600px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10">
              <Checkbox
                checked={data.length > 0 && selectedIds.size === data.length}
                onCheckedChange={() => toggleSelectAll(data)}
              />
            </TableHead>
            <TableHead className="font-bold">Page</TableHead>
            <TableHead className="text-center font-bold">Type</TableHead>
            <TableHead className="text-center font-bold">Value</TableHead>
            <TableHead className="text-center font-bold">AI Score</TableHead>
            <TableHead className="text-center font-bold">Local Auth.</TableHead>
            <TableHead className="text-center font-bold">Identity</TableHead>
            <TableHead className="text-center font-bold">Priority</TableHead>
            <TableHead className="text-center font-bold">Status</TableHead>
            <TableHead className="text-center font-bold">Index</TableHead>
            <TableHead className="text-center font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((page: any) => (
            <TableRow key={page.id} className="hover:bg-muted/30">
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(page.id)}
                  onCheckedChange={() => toggleSelect(page.id)}
                />
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1 py-0.5 rounded block max-w-[200px] truncate">/{page.slug}</code>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="text-xs">{page.page_type}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className={`font-bold text-sm ${scoreColor(page.page_value_score || 0)}`}>{page.page_value_score || 0}</span>
                  <Progress value={page.page_value_score || 0} className={`h-1 w-12 ${scoreBar(page.page_value_score || 0)}`} />
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-bold text-sm ${(page.ai_sounding_score || 0) >= 50 ? 'text-pink-500' : 'text-green-500'}`}>
                  {page.ai_sounding_score || 0}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-bold text-sm ${scoreColor(page.local_authenticity_score || 0)}`}>
                  {page.local_authenticity_score || 0}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className={`font-bold text-sm ${scoreColor(page.identity_score || 0)}`}>
                  {page.identity_score || 0}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {page.rewrite_priority && page.rewrite_priority !== 'none' ? (
                  <Badge className={`text-[10px] ${
                    page.rewrite_priority === 'critical' ? 'bg-red-500' :
                    page.rewrite_priority === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                  } text-white`}>
                    {page.rewrite_priority}
                  </Badge>
                ) : (
                  <Badge className="bg-green-500 text-white text-[10px]">Good</Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Select
                  value={page.editorial_status || 'pending'}
                  onValueChange={(v) => updateStatusMutation.mutate({ id: page.id, status: v })}
                >
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDITORIAL_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-center">
                {page.is_index_worthy ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => fixPageMutation.mutate(page.id)}
                    disabled={fixPageMutation.isPending && fixingPageId === page.id}
                  >
                    {fixPageMutation.isPending && fixingPageId === page.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wrench className="h-3 w-3" />
                    )}
                    Fix
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRollbackDialog({ pageId: page.id, slug: page.slug })}
                    title="View version history"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10 p-6 border border-rose-500/20">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              Human Content Quality
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-sounding detection, page value scoring, local authenticity, editorial approval & version rollback
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={auditPageType} onValueChange={setAuditPageType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Page type" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => auditMutation.mutate()} 
              disabled={auditMutation.isPending}
              className="bg-gradient-to-r from-rose-500 to-pink-500 gap-2"
            >
              {auditMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Auditing...</>
              ) : (
                <><Scan className="h-4 w-4" /> Run Quality Audit</>
              )}
            </Button>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Results Banner */}
      {auditResults.length > 0 && (
        <Card className="border-2 border-rose-500/30 bg-rose-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Audit Results: {auditResults.length} pages with quality issues
            </CardTitle>
            <CardDescription>
              Scanned {auditMutation.data?.total_scanned} pages. Issues include AI-sounding content, thin pages, and missing metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {auditResults.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/80 hover:bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/{r.slug}</code>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.issues.map((issue: string) => (
                          <Badge key={issue} className="text-[10px] bg-rose-500 text-white">{issue}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm ml-3">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">AI</p>
                        <p className={`font-bold ${r.ai_sounding_score >= 50 ? 'text-pink-500' : 'text-green-500'}`}>{r.ai_sounding_score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Value</p>
                        <p className={`font-bold ${scoreColor(r.page_value_score)}`}>{r.page_value_score}</p>
                      </div>
                      <Badge className={`text-[10px] ${
                        r.rewrite_priority === 'critical' ? 'bg-red-500' :
                        r.rewrite_priority === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                      } text-white`}>
                        {r.rewrite_priority}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 ml-2"
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
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Scanned', value: summaryStats.total, icon: BarChart3, color: 'text-primary' },
            { label: 'Below 60 Value', value: summaryStats.below60, icon: AlertTriangle, color: 'text-red-500' },
            { label: 'AI-Sounding', value: summaryStats.aiHigh, icon: Brain, color: 'text-pink-500' },
            { label: 'Low Local Auth.', value: summaryStats.lowLocal, icon: Globe, color: 'text-amber-500' },
            { label: 'Critical Rewrite', value: summaryStats.critical, icon: Zap, color: 'text-red-600' },
            { label: 'Pending Review', value: summaryStats.pending, icon: Clock, color: 'text-muted-foreground' },
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
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-border" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TabsList className="inline-flex w-max h-10 p-1 gap-0.5">
            <TabsTrigger value="overview" className="text-xs gap-1 whitespace-nowrap"><BarChart3 className="h-3 w-3" /> All Pages</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs gap-1 whitespace-nowrap"><Brain className="h-3 w-3" /> AI Detection ({aiSounding.length})</TabsTrigger>
            <TabsTrigger value="value" className="text-xs gap-1 whitespace-nowrap"><Target className="h-3 w-3" /> Low Value ({lowValue.length})</TabsTrigger>
            <TabsTrigger value="rewrite" className="text-xs gap-1 whitespace-nowrap"><Edit className="h-3 w-3" /> Rewrite Queue ({rewriteQueue.length})</TabsTrigger>
            <TabsTrigger value="editorial" className="text-xs gap-1 whitespace-nowrap"><Shield className="h-3 w-3" /> Editorial</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">
                  {activeTab === 'ai' ? 'AI-Sounding Pages' :
                   activeTab === 'value' ? 'Low Value Pages (< 60)' :
                   activeTab === 'rewrite' ? 'Rewrite Queue' :
                   activeTab === 'editorial' ? 'Editorial Approval' :
                   'All Scanned Pages'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <Button
                      size="sm"
                      onClick={() => bulkFixMutation.mutate(Array.from(selectedIds))}
                      disabled={bulkFixMutation.isPending}
                      className="bg-gradient-to-r from-rose-500 to-pink-500 gap-2"
                    >
                      {bulkFixMutation.isPending ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Fixing {selectedIds.size}...</>
                      ) : (
                        <><Wrench className="h-3 w-3" /> Fix All Selected ({selectedIds.size})</>
                      )}
                    </Button>
                  )}
                  {activeTab === 'overview' && (
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                renderTable(
                  activeTab === 'ai' ? aiSounding :
                  activeTab === 'value' ? lowValue :
                  activeTab === 'rewrite' ? rewriteQueue :
                  pages
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Empty state */}
      {!isLoading && pages.length === 0 && !auditMutation.isPending && auditResults.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Quality Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Click "Run Quality Audit" above to scan your pages for AI-sounding content, thin value, and other quality issues.
              You can also run a Page Identity Scan first for deeper similarity analysis.
            </p>
            <Button onClick={() => auditMutation.mutate()} disabled={auditMutation.isPending} variant="outline" className="gap-2">
              {auditMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
              Run Quality Audit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Version Rollback Dialog */}
      <Dialog open={!!rollbackDialog} onOpenChange={() => setRollbackDialog(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Version History & Rollback
            </DialogTitle>
            <DialogDescription>
              <code className="text-sm">/{rollbackDialog?.slug}</code> — Select a version to restore
            </DialogDescription>
          </DialogHeader>

          {versionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : versions && versions.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {versions.map((v: any) => (
                  <div key={v.id} className={`p-4 rounded-xl border ${v.is_rolled_back ? 'opacity-50 border-dashed' : 'hover:bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{v.version_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {v.is_rolled_back && (
                          <Badge className="bg-amber-500 text-white text-[10px]">Rolled Back</Badge>
                        )}
                        {!v.is_rolled_back && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rollbackMutation.mutate(v.id)}
                            disabled={rollbackMutation.isPending}
                            className="text-xs gap-1"
                          >
                            {rollbackMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Before</p>
                        <div className="bg-muted/30 p-2 rounded text-[11px] space-y-0.5">
                          <p><strong>Title:</strong> {(v.content_before as any)?.meta_title || '—'}</p>
                          <p><strong>H1:</strong> {(v.content_before as any)?.h1 || '—'}</p>
                          <p><strong>Words:</strong> {(v.content_before as any)?.word_count || '—'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">After</p>
                        <div className="bg-muted/30 p-2 rounded text-[11px] space-y-0.5">
                          <p><strong>Title:</strong> {(v.content_after as any)?.meta_title || '—'}</p>
                          <p><strong>H1:</strong> {(v.content_after as any)?.h1 || '—'}</p>
                          <p><strong>Words:</strong> {(v.content_after as any)?.word_count || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No content versions found for this page.</p>
              <p className="text-xs mt-1">Versions are created when bulk AI regeneration modifies content.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
