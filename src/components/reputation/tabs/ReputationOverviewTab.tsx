'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Star, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown,
  AlertTriangle, Activity, Clock, Eye, Brain, Loader2,
  Sparkles, Lightbulb, Award,
} from 'lucide-react';
import { subDays, format } from 'date-fns';

interface Props {
  clinicId?: string;
  isAdmin?: boolean;
}

export default function ReputationOverviewTab({ clinicId, isAdmin }: Props) {
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);

  // Fetch Google reviews
  const { data: googleReviews = [], isLoading: googleLoading } = useQuery({
    queryKey: ['rep-google-reviews', clinicId],
    queryFn: async () => {
      let query = supabase
        .from('google_reviews')
        .select('*, clinic:clinics(id, name)')
        .order('review_time', { ascending: false })
        .limit(500);
      if (clinicId) query = query.eq('clinic_id', clinicId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch internal reviews
  const { data: internalReviews = [], isLoading: internalLoading } = useQuery({
    queryKey: ['rep-internal-reviews', clinicId],
    queryFn: async () => {
      let query = supabase
        .from('internal_reviews')
        .select('*, clinic:clinics(id, name)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (clinicId) query = query.eq('clinic_id', clinicId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch funnel events
  const { data: funnelEvents = [], isLoading: funnelLoading } = useQuery({
    queryKey: ['rep-funnel-events', clinicId],
    queryFn: async () => {
      let query = supabase
        .from('review_funnel_events')
        .select('*')
        .order('created_at', { ascending: false })
      if (clinicId) query = query.eq('clinic_id', clinicId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['rep-alerts', clinicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reputation_alerts' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return [];
      return data || [];
    },
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const avgGoogleRating = googleReviews.length
      ? googleReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / googleReviews.length
      : 0;
    const recentGoogleReviews = googleReviews.filter(
      (r: any) => new Date(r.review_time || r.created_at) >= thirtyDaysAgo
    );
    const unrepliedGoogle = googleReviews.filter((r: any) => r.reply_status !== 'posted');

    const avgInternalRating = internalReviews.length
      ? internalReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / internalReviews.length
      : 0;
    const newInternalReviews = internalReviews.filter((r: any) => r.status === 'new');

    const thumbsUp = funnelEvents.filter((e: any) => e.event_type === 'thumbs_up').length;
    const thumbsDown = funnelEvents.filter((e: any) => e.event_type === 'thumbs_down').length;
    const totalFunnel = funnelEvents.length;
    const conversionRate = totalFunnel > 0 ? (thumbsUp / totalFunnel) * 100 : 0;

    const last30Funnel = funnelEvents.filter((e: any) => new Date(e.created_at) >= thirtyDaysAgo);
    const last30Up = last30Funnel.filter((e: any) => e.event_type === 'thumbs_up').length;
    const last30Down = last30Funnel.filter((e: any) => e.event_type === 'thumbs_down').length;

    // Sentiment stats
    const analyzedReviews = googleReviews.filter((r: any) => r.sentiment_label);
    const sentimentCoverage = googleReviews.length > 0
      ? (analyzedReviews.length / googleReviews.length) * 100
      : 0;

    const ratingScore = (avgGoogleRating / 5) * 40;
    const velocityScore = Math.min(recentGoogleReviews.length / 20, 1) * 25;
    const responseScore = googleReviews.length > 0
      ? ((googleReviews.length - unrepliedGoogle.length) / googleReviews.length) * 20
      : 10;
    const sentimentScore = totalFunnel > 0 ? (thumbsUp / totalFunnel) * 15 : 7.5;
    const reputationScore = Math.round(ratingScore + velocityScore + responseScore + sentimentScore);

    const hasRatingDrop = avgGoogleRating < 4.0;
    const hasSlowReplies = unrepliedGoogle.length > 5;
    const hasNegativeTrend = last30Down > last30Up;
    const riskScore = (hasRatingDrop ? 30 : 0) + (hasSlowReplies ? 30 : 0) + (hasNegativeTrend ? 20 : 0);

    return {
      reputationScore, riskScore, avgGoogleRating, avgInternalRating,
      totalGoogleReviews: googleReviews.length, totalInternalReviews: internalReviews.length,
      recentGoogleReviews: recentGoogleReviews.length, unrepliedCount: unrepliedGoogle.length,
      newInternalCount: newInternalReviews.length, thumbsUp, thumbsDown, conversionRate,
      last30Up, last30Down, sentimentCoverage,
      activeAlerts: alerts.filter((a: any) => a.status !== 'resolved').length,
    };
  }, [googleReviews, internalReviews, funnelEvents, alerts]);

  // Generate AI Insights
  const generateAiInsights = async () => {
    setAiInsightsLoading(true);
    try {
      const reviewsSummary = {
        total_google: kpis.totalGoogleReviews,
        avg_rating: kpis.avgGoogleRating,
        unreplied: kpis.unrepliedCount,
        recent_30d: kpis.recentGoogleReviews,
        reputation_score: kpis.reputationScore,
        risk_score: kpis.riskScore,
        funnel_positive: kpis.thumbsUp,
        funnel_negative: kpis.thumbsDown,
        conversion_rate: kpis.conversionRate,
        sentiment_coverage: kpis.sentimentCoverage,
        recent_reviews: googleReviews.slice(0, 20).map((r: any) => ({
          rating: r.rating,
          sentiment: r.sentiment_label,
          replied: r.reply_status === 'posted',
          content_preview: (r.text_content || '').slice(0, 100),
        })),
      };

      const { data, error } = await supabase.functions.invoke('reputation-ai', {
        body: { action: 'overview_insights', reviews_data: reviewsSummary },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setAiInsights(data.insights);
      toast.success('AI insights generated');
    } catch (e: any) {
      toast.error('Failed to generate insights: ' + e.message);
    } finally {
      setAiInsightsLoading(false);
    }
  };

  const isLoading = googleLoading || internalLoading || funnelLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getRiskColor = (score: number) => {
    if (score >= 60) return 'text-red-500';
    if (score >= 30) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-teal/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <Badge className={`${kpis.reputationScore >= 60 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                {getScoreLabel(kpis.reputationScore)}
              </Badge>
            </div>
            <p className={`text-4xl font-bold ${getScoreColor(kpis.reputationScore)}`}>{kpis.reputationScore}</p>
            <p className="text-sm text-muted-foreground">Reputation Score</p>
            <Progress value={kpis.reputationScore} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">Google</span>
            </div>
            <p className="text-4xl font-bold">{kpis.avgGoogleRating ? kpis.avgGoogleRating.toFixed(1) : 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Avg Rating ({kpis.totalGoogleReviews} reviews)</p>
            <div className="flex gap-0.5 mt-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(kpis.avgGoogleRating) ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={kpis.unrepliedCount > 5 ? 'border-amber-500/50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              {kpis.unrepliedCount > 5 && <Badge variant="destructive" className="text-xs">Action Needed</Badge>}
            </div>
            <p className="text-4xl font-bold">{kpis.unrepliedCount}</p>
            <p className="text-sm text-muted-foreground">Unreplied Reviews</p>
            <p className="text-xs text-muted-foreground mt-2">{kpis.newInternalCount} new internal feedback</p>
          </CardContent>
        </Card>

        <Card className={kpis.riskScore >= 30 ? 'border-amber-500/50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                kpis.riskScore >= 60 ? 'bg-red-100' : kpis.riskScore >= 30 ? 'bg-amber-100' : 'bg-emerald-100'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${getRiskColor(kpis.riskScore)}`} />
              </div>
              {kpis.activeAlerts > 0 && <Badge variant="destructive" className="text-xs">{kpis.activeAlerts} Active</Badge>}
            </div>
            <p className={`text-4xl font-bold ${getRiskColor(kpis.riskScore)}`}>{kpis.riskScore}%</p>
            <p className="text-sm text-muted-foreground">Risk Level</p>
            <p className="text-xs text-muted-foreground mt-2">
              {kpis.riskScore >= 60 ? 'High risk - immediate action' : kpis.riskScore >= 30 ? 'Medium risk - monitor closely' : 'Low risk - healthy status'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Reputation Insights
              </CardTitle>
              <CardDescription>Gemini-powered executive summary and recommendations</CardDescription>
            </div>
            <Button onClick={generateAiInsights} disabled={aiInsightsLoading} className="gap-2">
              {aiInsightsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Insights
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiInsights ? (
            <div className="space-y-4">
              {/* Executive Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">Health Grade: {aiInsights.health_grade}</span>
                </div>
                <p className="text-sm">{aiInsights.executive_summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                {aiInsights.top_strengths?.length > 0 && (
                  <div className="p-4 rounded-lg border bg-emerald-50/50">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-emerald-700">
                      <TrendingUp className="h-4 w-4" />
                      Top Strengths
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.top_strengths.map((s: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                {aiInsights.top_concerns?.length > 0 && (
                  <div className="p-4 rounded-lg border bg-amber-50/50">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      Top Concerns
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.top_concerns.map((c: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">⚠</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Quick Wins */}
              {aiInsights.quick_wins?.length > 0 && (
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Quick Wins
                  </h4>
                  <ul className="space-y-1">
                    {aiInsights.quick_wins.map((w: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">→</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiInsights.competitor_positioning && (
                <p className="text-xs text-muted-foreground italic">{aiInsights.competitor_positioning}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Click "Generate Insights" to get AI-powered recommendations</p>
              <p className="text-xs mt-1">Analysis covers ratings, reply rates, sentiment, and trends</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Funnel Performance
            </CardTitle>
            <CardDescription>Review collection funnel stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">Positive (→ Google)</span>
              </div>
              <span className="font-bold">{kpis.thumbsUp}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-red-500" />
                <span className="text-sm">Private Feedback</span>
              </div>
              <span className="font-bold">{kpis.thumbsDown}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-bold text-primary">{kpis.conversionRate.toFixed(1)}%</span>
              </div>
              <Progress value={kpis.conversionRate} className="h-2" />
            </div>
            <div className="pt-2 text-sm text-muted-foreground">
              Last 30 days: +{kpis.last30Up} positive, {kpis.last30Down} private
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI Coverage
                </span>
                <span className="text-sm font-medium">{kpis.sentimentCoverage.toFixed(0)}%</span>
              </div>
              <Progress value={kpis.sentimentCoverage} className="h-1.5 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest reviews and feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {googleReviews.slice(0, 5).map((review: any) => (
                <div key={review.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{review.author_name}</span>
                      <Badge variant="outline" className="text-xs">Google</Badge>
                      {review.sentiment_label && (
                        <Badge className={`text-xs ${
                          review.sentiment_label === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                          review.sentiment_label === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          <Brain className="h-2.5 w-2.5 mr-0.5" />{review.sentiment_label}
                        </Badge>
                      )}
                      {review.reply_status !== 'posted' && (
                        <Badge variant="destructive" className="text-xs">Needs Reply</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {review.text_content || 'No comment'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {review.review_time ? format(new Date(review.review_time), 'MMM d') : 'N/A'}
                  </span>
                </div>
              ))}
              {googleReviews.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No Google reviews found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
