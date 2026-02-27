'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Sparkles, Brain, MessageSquare, AlertTriangle, Activity, Settings, Zap,
  CheckCircle, XCircle, Loader2, TrendingUp, Play, RefreshCw,
} from 'lucide-react';
import { createAuditLog } from '@/lib/audit';

interface Props {
  clinicId?: string;
  isAdmin?: boolean;
}

export default function ReputationAITab({ clinicId, isAdmin }: Props) {
  const queryClient = useQueryClient();
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Fetch AI module settings
  const { data: aiSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['ai-module-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_module_settings')
        .select('*')
        .order('module');
      if (error) return [];
      return data || [];
    },
    enabled: !!isAdmin,
  });

  // Fetch recent AI events
  const { data: aiEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['ai-events-recent', clinicId],
    queryFn: async () => {
      let query = supabase
        .from('ai_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (clinicId) query = query.eq('clinic_id', clinicId);
      const { data, error } = await query.limit(50);
      if (error) return [];
      return data || [];
    },
  });

  // Test AI Connection
  const testAiConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('reputation-ai', {
        body: { action: 'test_connection' },
      });
      if (error) throw error;
      setTestResult(data);
      if (data.success) {
        toast.success(data.message || 'AI connection successful');
      } else {
        toast.error(data.error || 'AI connection failed');
      }
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
      toast.error('Test failed: ' + e.message);
    } finally {
      setTestLoading(false);
    }
  };

  // Bulk sentiment analysis
  const bulkAnalysisMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('reputation-ai', {
        body: { action: 'bulk_sentiment', clinic_id: clinicId },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['reviews-google'] });
      queryClient.invalidateQueries({ queryKey: ['reviews-internal'] });
      queryClient.invalidateQueries({ queryKey: ['ai-events-recent'] });
    },
    onError: (e: Error) => toast.error('Bulk analysis failed: ' + e.message),
  });

  // Toggle AI module
  const toggleModule = useMutation({
    mutationFn: async ({ module, enabled }: { module: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('ai_module_settings')
        .upsert({
          module,
          is_enabled: enabled,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      await createAuditLog({
        action: enabled ? 'enable_ai_module' : 'disable_ai_module',
        entityType: 'ai_module',
        entityId: module,
      });
    },
    onSuccess: () => {
      toast.success('AI module updated');
      queryClient.invalidateQueries({ queryKey: ['ai-module-settings'] });
    },
    onError: (e: Error) => toast.error('Failed: ' + e.message),
  });

  const modules = [
    { id: 'sentiment_analysis', name: 'Sentiment Analysis', description: 'Analyze review sentiment, themes, and HIPAA concerns using Gemini AI', icon: Brain },
    { id: 'reply_generation', name: 'Reply Generation', description: 'Generate professional review replies using Gemini AI', icon: MessageSquare },
    { id: 'risk_detection', name: 'Risk Detection', description: 'AI-powered reputation risk assessment and recommendations', icon: AlertTriangle },
    { id: 'trend_analysis', name: 'Trend Analysis', description: 'AI trend analysis with predictions and strategic recommendations', icon: TrendingUp },
  ];

  const getModuleSetting = (moduleId: string) => {
    const setting = aiSettings?.find((s: any) => s.module === moduleId);
    return setting?.is_enabled ?? true;
  };

  const isLoading = settingsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gemini AI Status & Test */}
      <Card className={testResult?.success === false ? 'border-red-500/50' : testResult?.success ? 'border-emerald-500/50' : 'border-primary/30'}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${
                testResult?.success ? 'bg-emerald-100' : testResult?.success === false ? 'bg-red-100' : 'bg-primary/10'
              }`}>
                <Sparkles className={`h-7 w-7 ${
                  testResult?.success ? 'text-emerald-600' : testResult?.success === false ? 'text-red-600' : 'text-primary'
                }`} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Gemini AI Engine (AIMLAPI)
                  {testResult?.success && <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>}
                  {testResult?.success === false && <Badge variant="destructive">Error</Badge>}
                  {testResult === null && <Badge variant="outline">Not Tested</Badge>}
                </h2>
                <p className="text-muted-foreground">
                  {testResult?.message || testResult?.error || 'Test the AI connection to verify Gemini is operational'}
                </p>
              </div>
            </div>
            <Button onClick={testAiConnection} disabled={testLoading} className="gap-2">
              {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Quick Actions
          </CardTitle>
          <CardDescription>Run AI operations on your review data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Bulk Sentiment Analysis</p>
                  <p className="text-sm text-muted-foreground">Analyze up to 10 unanalyzed reviews</p>
                </div>
              </div>
              <Button
                onClick={() => bulkAnalysisMutation.mutate()}
                disabled={bulkAnalysisMutation.isPending}
                className="w-full gap-2"
              >
                {bulkAnalysisMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Run Bulk Analysis
              </Button>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Refresh AI Events</p>
                  <p className="text-sm text-muted-foreground">Reload latest AI activity log</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['ai-events-recent'] })}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Activity
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Modules */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              AI Modules
            </CardTitle>
            <CardDescription>Enable or disable specific AI capabilities (all powered by Gemini via AIMLAPI)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {modules.map((module) => {
              const Icon = module.icon;
              const enabled = getModuleSetting(module.id);
              return (
                <div key={module.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => toggleModule.mutate({ module: module.id, enabled: checked })}
                    disabled={toggleModule.isPending}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent AI Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Activity</CardTitle>
          <CardDescription>Latest AI operations and results</CardDescription>
        </CardHeader>
        <CardContent>
          {aiEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No AI activity yet</p>
              <p className="text-sm mt-1">Run a bulk analysis or test the connection to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aiEvents.slice(0, 15).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {event.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : event.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-primary animate-pulse" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{event.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{event.module}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.confidence_score ? `${(event.confidence_score * 100).toFixed(0)}%` : event.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Rules */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>AI Safety Rules</CardTitle>
            <CardDescription>Guardrails for AI operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label>Require confirmation before posting</Label>
                <p className="text-sm text-muted-foreground">AI-generated replies must be approved before posting</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label>Block HIPAA-sensitive content</Label>
                <p className="text-sm text-muted-foreground">Automatically flag reviews containing PHI</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <Label>Human escalation threshold</Label>
                <p className="text-sm text-muted-foreground">Escalate to human review when confidence &lt; 70%</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
