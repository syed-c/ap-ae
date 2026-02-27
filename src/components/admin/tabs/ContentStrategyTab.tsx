'use client';
/**
 * ContentStrategyTab - Phase 10: Content Strategy
 * 
 * Admin interface for:
 * - Editorial Calendar (plan, schedule, track blog posts)
 * - Topic Clusters (pillar/spoke keyword strategy)
 * - Content Templates (reusable blog structures)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar,
  FileText,
  Network,
  Plus,
  Target,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  BookOpen,
  TrendingUp,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';
import { format } from 'date-fns';

// ── Types ──
interface EditorialItem {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  topic_cluster_id: string | null;
  target_keyword: string | null;
  content_type: string;
  target_word_count: number;
  scheduled_date: string | null;
  published_date: string | null;
  notes: string | null;
  template_id: string | null;
  created_at: string;
}

interface TopicCluster {
  id: string;
  cluster_name: string;
  primary_keyword: string;
  related_keywords: string[] | null;
  intent_type: string | null;
  pillar_page_slug: string | null;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  content_structure: any;
  target_word_count: number;
  seo_guidelines: string | null;
  example_titles: string[] | null;
  usage_count: number;
}

// ── Status helpers ──
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  idea: { label: 'Idea', color: 'bg-muted text-muted-foreground' },
  outlined: { label: 'Outlined', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  writing: { label: 'Writing', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  review: { label: 'In Review', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  scheduled: { label: 'Scheduled', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  published: { label: 'Published', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
};

const PRIORITY_CONFIG: Record<string, string> = {
  high: 'text-red-600 border-red-300',
  medium: 'text-yellow-600 border-yellow-300',
  low: 'text-muted-foreground border-border',
};

const INTENT_COLORS: Record<string, string> = {
  informational: 'bg-blue-100 text-blue-800',
  commercial: 'bg-green-100 text-green-800',
  transactional: 'bg-orange-100 text-orange-800',
  navigational: 'bg-purple-100 text-purple-800',
};

export default function ContentStrategyTab() {
  return (
    <Tabs defaultValue="calendar" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="calendar" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Editorial Calendar
        </TabsTrigger>
        <TabsTrigger value="clusters" className="flex items-center gap-2">
          <Network className="h-4 w-4" />
          Topic Clusters
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar">
        <EditorialCalendarPanel />
      </TabsContent>
      <TabsContent value="clusters">
        <TopicClustersPanel />
      </TabsContent>
      <TabsContent value="templates">
        <TemplatesPanel />
      </TabsContent>
    </Tabs>
  );
}

// ═══════════════════════════════════════════
// Editorial Calendar Panel
// ═══════════════════════════════════════════
function EditorialCalendarPanel() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: items, isLoading } = useQuery({
    queryKey: ['editorial-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('editorial_calendar')
        .select('*')
        .order('scheduled_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as EditorialItem[];
    },
  });

  const { data: clusters } = useQuery({
    queryKey: ['topic-clusters'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_topic_clusters').select('*');
      return (data || []) as TopicCluster[];
    },
  });

  const { data: templates } = useQuery({
    queryKey: ['content-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_content_templates').select('*').eq('is_active', true);
      return (data || []) as ContentTemplate[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: Partial<EditorialItem>) => {
      const { error } = await supabase.from('editorial_calendar').insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-calendar'] });
      setShowAddDialog(false);
      toast.success('Content item added to calendar');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'published') updates.published_date = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('editorial_calendar').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-calendar'] });
      toast.success('Status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('editorial_calendar').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-calendar'] });
      toast.success('Item removed');
    },
  });

  const filtered = items?.filter(i => filterStatus === 'all' || i.status === filterStatus) || [];

  // Stats
  const stats = {
    total: items?.length || 0,
    ideas: items?.filter(i => i.status === 'idea').length || 0,
    inProgress: items?.filter(i => ['outlined', 'writing', 'review'].includes(i.status)).length || 0,
    published: items?.filter(i => i.status === 'published').length || 0,
    scheduled: items?.filter(i => i.status === 'scheduled').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: FileText },
          { label: 'Ideas', value: stats.ideas, icon: Sparkles },
          { label: 'In Progress', value: stats.inProgress, icon: Edit2 },
          { label: 'Scheduled', value: stats.scheduled, icon: Clock },
          { label: 'Published', value: stats.published, icon: CheckCircle2 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <s.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Content</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add to Editorial Calendar</DialogTitle>
            </DialogHeader>
            <AddContentForm
              clusters={clusters || []}
              templates={templates || []}
              onSubmit={(data) => addMutation.mutate(data)}
              isLoading={addMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No content items yet</p>
              <p className="text-sm text-muted-foreground">Add your first blog post idea to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(item => (
            <Card key={item.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold truncate">{item.title}</h4>
                      <Badge className={STATUS_CONFIG[item.status]?.color || ''}>
                        {STATUS_CONFIG[item.status]?.label || item.status}
                      </Badge>
                      <Badge variant="outline" className={PRIORITY_CONFIG[item.priority] || ''}>
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {item.target_keyword && (
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {item.target_keyword}
                        </span>
                      )}
                      {item.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.scheduled_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {item.content_type && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {item.content_type.replace('_', ' ')}
                        </span>
                      )}
                      <span>{item.target_word_count?.toLocaleString()} words</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Select
                      value={item.status}
                      onValueChange={(val) => updateStatusMutation.mutate({ id: item.id, status: val })}
                    >
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ── Add Content Form ──
function AddContentForm({
  clusters,
  templates,
  onSubmit,
  isLoading,
}: {
  clusters: TopicCluster[];
  templates: ContentTemplate[];
  onSubmit: (data: Partial<EditorialItem>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    title: '',
    target_keyword: '',
    content_type: 'blog_post',
    priority: 'medium',
    topic_cluster_id: '',
    template_id: '',
    scheduled_date: '',
    target_word_count: 1500,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      topic_cluster_id: form.topic_cluster_id || null,
      template_id: form.template_id || null,
      scheduled_date: form.scheduled_date || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Target Keyword</Label>
          <Input value={form.target_keyword} onChange={e => setForm(p => ({ ...p, target_keyword: e.target.value }))} />
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Topic Cluster</Label>
          <Select value={form.topic_cluster_id} onValueChange={v => setForm(p => ({ ...p, topic_cluster_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>
              {clusters.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.cluster_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Template</Label>
          <Select value={form.template_id} onValueChange={v => setForm(p => ({ ...p, template_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Scheduled Date</Label>
          <Input type="date" value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
        </div>
        <div>
          <Label>Target Words</Label>
          <Input type="number" value={form.target_word_count} onChange={e => setForm(p => ({ ...p, target_word_count: parseInt(e.target.value) || 1500 }))} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || !form.title}>
        {isLoading ? 'Adding...' : 'Add to Calendar'}
      </Button>
    </form>
  );
}

// ═══════════════════════════════════════════
// Topic Clusters Panel
// ═══════════════════════════════════════════
function TopicClustersPanel() {
  const { data: clusters, isLoading } = useQuery({
    queryKey: ['topic-clusters'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_topic_clusters').select('*').order('cluster_name');
      return (data || []) as TopicCluster[];
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Topic Clusters
          </CardTitle>
          <CardDescription>
            Keyword strategy organized by pillar topics. Each cluster targets a primary keyword with supporting content.
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading clusters...</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {clusters?.map(cluster => (
            <Card key={cluster.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{cluster.cluster_name}</CardTitle>
                  {cluster.intent_type && (
                    <Badge className={INTENT_COLORS[cluster.intent_type] || 'bg-muted'}>
                      {cluster.intent_type}
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {cluster.primary_keyword}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cluster.related_keywords?.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
                {cluster.pillar_page_slug && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Pillar: {cluster.pillar_page_slug}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Templates Panel
// ═══════════════════════════════════════════
function TemplatesPanel() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['content-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_content_templates').select('*').order('category');
      return (data || []) as ContentTemplate[];
    },
  });

  const CATEGORY_ICONS: Record<string, string> = {
    pillar: '📖',
    commercial: '💰',
    informational: 'ℹ️',
    local: '📍',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Content Templates
          </CardTitle>
          <CardDescription>
            Reusable blog post structures with SEO guidelines. Select a template when creating content to follow proven formats.
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading templates...</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {templates?.map(template => {
            const sections = Array.isArray(template.content_structure) ? template.content_structure : [];
            return (
              <Card key={template.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>{CATEGORY_ICONS[template.category] || '📄'}</span>
                        {template.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary">{template.target_word_count.toLocaleString()} words</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Used {template.usage_count}×</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Structure outline */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sections.map((section: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {section.label} ({section.word_count}w)
                      </Badge>
                    ))}
                  </div>

                  {/* SEO guidelines */}
                  {template.seo_guidelines && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground mb-3">
                      <p className="font-medium text-foreground mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        SEO Guidelines
                      </p>
                      {template.seo_guidelines}
                    </div>
                  )}

                  {/* Example titles */}
                  {template.example_titles && template.example_titles.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Example Titles:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {template.example_titles.map((title, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-primary">•</span> {title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
