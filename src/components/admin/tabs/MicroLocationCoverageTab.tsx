'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, Building2, FileText, AlertTriangle, CheckCircle, 
  Search, TrendingUp, Globe, Target, BarChart3, Loader2,
  XCircle, ArrowUpRight, Layers
} from 'lucide-react';
import { toast } from 'sonner';

// ─── UAE Area Local Context Database ───
// Unique neighborhood characteristics for content differentiation
const AREA_LOCAL_CONTEXT: Record<string, {
  character: string;
  demographics: string;
  landmarks: string[];
  narrative: string;
}> = {
  'jumeirah': {
    character: 'upscale beachfront residential',
    demographics: 'affluent families and expat professionals',
    landmarks: ['Jumeirah Mosque', 'Kite Beach', 'La Mer'],
    narrative: 'family-focused wellness',
  },
  'dubai-marina': {
    character: 'cosmopolitan waterfront towers',
    demographics: 'young professionals and international residents',
    landmarks: ['Marina Walk', 'Dubai Marina Mall', 'Ain Dubai'],
    narrative: 'modern lifestyle convenience',
  },
  'deira': {
    character: 'historic commercial district',
    demographics: 'diverse multicultural community',
    landmarks: ['Gold Souk', 'Deira City Centre', 'Creek'],
    narrative: 'heritage-meets-accessibility',
  },
  'business-bay': {
    character: 'modern commercial hub',
    demographics: 'corporate professionals and urban residents',
    landmarks: ['Dubai Canal', 'Bay Avenue', 'Marasi Drive'],
    narrative: 'efficiency-first corporate care',
  },
  'downtown-dubai': {
    character: 'premium urban landmark district',
    demographics: 'tourists, luxury residents and business travelers',
    landmarks: ['Burj Khalifa', 'Dubai Mall', 'Dubai Fountain'],
    narrative: 'world-class premium dental',
  },
  'al-barsha': {
    character: 'established residential and retail hub',
    demographics: 'families, students and mid-range professionals',
    landmarks: ['Mall of the Emirates', 'Barsha Park'],
    narrative: 'value-driven family dentistry',
  },
  'healthcare-city': {
    character: 'medical free zone and health hub',
    demographics: 'medical tourists and specialist-seekers',
    landmarks: ['DHCC', 'Mediclinic', 'Al Jalila Foundation'],
    narrative: 'specialist medical destination',
  },
  'jbr': {
    character: 'beachfront leisure and tourism strip',
    demographics: 'tourists, hotel residents and coastal lifestyle',
    landmarks: ['The Walk', 'Bluewaters Island', 'JBR Beach'],
    narrative: 'resort-style dental experience',
  },
  'jlt': {
    character: 'mid-range lakeside towers',
    demographics: 'young professionals and small families',
    landmarks: ['JLT Park', 'Cluster towers', 'Dubai Metro'],
    narrative: 'affordable professional care',
  },
  'al-safa': {
    character: 'leafy residential enclave near Jumeirah',
    demographics: 'established families and villa residents',
    landmarks: ['Safa Park', 'City Walk nearby'],
    narrative: 'quiet neighborhood dentistry',
  },
  'bur-dubai': {
    character: 'vibrant old-town cultural melting pot',
    demographics: 'diverse residents, workers and heritage visitors',
    landmarks: ['Dubai Museum', 'Meena Bazaar', 'Textile Souk'],
    narrative: 'accessible multilingual care',
  },
  'international-city': {
    character: 'affordable multicultural township',
    demographics: 'budget-conscious residents and new immigrants',
    landmarks: ['Dragon Mart', 'Central Park'],
    narrative: 'budget-friendly community dental',
  },
  'difc': {
    character: 'premium financial free zone',
    demographics: 'executives, finance professionals and diplomats',
    landmarks: ['Gate Building', 'DIFC Art Nights', 'Gate Avenue'],
    narrative: 'executive concierge dentistry',
  },
  'discovery-gardens': {
    character: 'affordable garden-themed community',
    demographics: 'families and mid-income residents',
    landmarks: ['Ibn Battuta Mall nearby', 'Gardens community'],
    narrative: 'community-centered family care',
  },
  'jvc': {
    character: 'emerging family-friendly community',
    demographics: 'young families and first-time homeowners',
    landmarks: ['JVC Park', 'Circle Mall'],
    narrative: 'growing community wellness',
  },
  'al-nahda-dubai': {
    character: 'border community shared with Sharjah',
    demographics: 'cross-border commuters and mixed residents',
    landmarks: ['Al Nahda Park', 'Sahara Centre nearby'],
    narrative: 'convenient cross-emirate care',
  },
  'al-quoz': {
    character: 'industrial-turned-creative district',
    demographics: 'artists, gallery-goers and workers',
    landmarks: ['Alserkal Avenue', 'Al Quoz Industrial'],
    narrative: 'creative district healthcare',
  },
  'al-rashidiya': {
    character: 'established residential near airport',
    demographics: 'families, airport workers and long-term residents',
    landmarks: ['Rashidiya Metro', 'near DXB Airport'],
    narrative: 'airport-accessible dental care',
  },
  'dubai-hills': {
    character: 'premium master-planned community',
    demographics: 'affluent families and villa owners',
    landmarks: ['Dubai Hills Mall', 'Dubai Hills Park', 'Golf Club'],
    narrative: 'premium suburban wellness',
  },
  'al-mamzar': {
    character: 'coastal residential near Sharjah border',
    demographics: 'mixed-income families and beachgoers',
    landmarks: ['Al Mamzar Beach Park', 'Mamzar Corniche'],
    narrative: 'seaside community care',
  },
  'al-warqa': {
    character: 'quiet suburban residential area',
    demographics: 'local Emirati families and long-term residents',
    landmarks: ['Al Warqa Park', 'Warqa City Mall'],
    narrative: 'trusted neighborhood dentistry',
  },
};

type AreaHealth = 'strong' | 'moderate' | 'weak' | 'empty';

function getAreaHealth(clinicCount: number, hasSeoContent: boolean): AreaHealth {
  if (clinicCount === 0) return 'empty';
  if (clinicCount >= 20 && hasSeoContent) return 'strong';
  if (clinicCount >= 5) return 'moderate';
  return 'weak';
}

function HealthBadge({ health }: { health: AreaHealth }) {
  const config = {
    strong: { label: 'Strong', className: 'bg-teal/20 text-teal border-teal/30' },
    moderate: { label: 'Moderate', className: 'bg-gold/20 text-gold border-gold/30' },
    weak: { label: 'Weak', className: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
    empty: { label: 'Empty', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  };
  const c = config[health];
  return <Badge className={c.className}>{c.label}</Badge>;
}

export default function MicroLocationCoverageTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [emirateFilter, setEmirateFilter] = useState<string>('all');

  // Fetch all areas with their clinic counts and SEO status
  const { data: areasData, isLoading } = useQuery({
    queryKey: ['micro-location-coverage'],
    queryFn: async () => {
      // Get all areas with their emirate info
      const { data: cities } = await supabase
        .from('cities')
        .select('id, name, slug, state_id, dentist_count, is_active, state:states(id, name, slug, abbreviation)')
        .eq('is_active', true)
        .order('name');

      // Get clinic counts per city
      const { data: clinicCounts } = await supabase
        .from('clinics')
        .select('city_id')
        .eq('is_active', true);

      // Get SEO pages that exist for areas
      const { data: seoPages } = await supabase
        .from('seo_pages')
        .select('slug, is_published, is_thin_content')
        .eq('page_type', 'city');

      // Count clinics per city
      const clinicCountMap: Record<string, number> = {};
      (clinicCounts || []).forEach(c => {
        if (c.city_id) {
          clinicCountMap[c.city_id] = (clinicCountMap[c.city_id] || 0) + 1;
        }
      });

      // Map SEO pages
      const seoMap: Record<string, { published: boolean; thin: boolean }> = {};
      (seoPages || []).forEach(p => {
        seoMap[p.slug] = { published: p.is_published, thin: p.is_thin_content };
      });

      return (cities || []).map(city => {
        const emirate = (city.state as any);
        const seoSlug = `${emirate?.slug || ''}/${city.slug}`;
        const clinicCount = clinicCountMap[city.id] || 0;
        const seo = seoMap[seoSlug];
        const localContext = AREA_LOCAL_CONTEXT[city.slug];
        const health = getAreaHealth(clinicCount, !!seo?.published);

        return {
          id: city.id,
          name: city.name,
          slug: city.slug,
          emirate: emirate?.name || 'Unknown',
          emirateSlug: emirate?.slug || '',
          emirateAbbr: emirate?.abbreviation || '',
          clinicCount,
          hasSeoContent: !!seo?.published,
          isThinContent: seo?.thin || false,
          hasLocalContext: !!localContext,
          localContext,
          health,
          url: `/${emirate?.slug || ''}/${city.slug}/`,
        };
      });
    },
    staleTime: 60_000,
  });

  const areas = areasData || [];

  // Compute summary stats
  const stats = useMemo(() => {
    const total = areas.length;
    const strong = areas.filter(a => a.health === 'strong').length;
    const moderate = areas.filter(a => a.health === 'moderate').length;
    const weak = areas.filter(a => a.health === 'weak').length;
    const empty = areas.filter(a => a.health === 'empty').length;
    const withContent = areas.filter(a => a.hasSeoContent).length;
    const withLocalContext = areas.filter(a => a.hasLocalContext).length;
    const totalClinics = areas.reduce((sum, a) => sum + a.clinicCount, 0);
    const emirates = [...new Set(areas.map(a => a.emirate))];

    return { total, strong, moderate, weak, empty, withContent, withLocalContext, totalClinics, emirates };
  }, [areas]);

  // Filter areas
  const filteredAreas = useMemo(() => {
    return areas.filter(a => {
      if (emirateFilter !== 'all' && a.emirate !== emirateFilter) return false;
      if (searchTerm && !a.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.clinicCount - a.clinicCount);
  }, [areas, emirateFilter, searchTerm]);

  // Group by emirate for the heatmap
  const emirateGroups = useMemo(() => {
    const groups: Record<string, typeof areas> = {};
    areas.forEach(a => {
      if (!groups[a.emirate]) groups[a.emirate] = [];
      groups[a.emirate].push(a);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [areas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const coverageScore = stats.total > 0 ? Math.round(((stats.strong + stats.moderate) / stats.total) * 100) : 0;
  const contentScore = stats.total > 0 ? Math.round((stats.withContent / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Micro-Location Coverage</h1>
        <p className="text-muted-foreground text-sm">
          Area-level SEO health across all Emirates — clinic density, content status & local context coverage
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-display font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Areas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-5 w-5 text-teal mx-auto mb-1" />
            <p className="text-2xl font-display font-bold">{stats.totalClinics}</p>
            <p className="text-xs text-muted-foreground">Total Clinics</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-teal mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-teal">{stats.strong}</p>
            <p className="text-xs text-muted-foreground">Strong Areas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-gold mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-gold">{stats.moderate + stats.weak}</p>
            <p className="text-xs text-muted-foreground">Needs Work</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-display font-bold">{contentScore}%</p>
            <p className="text-xs text-muted-foreground">Content Coverage</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-display font-bold">{stats.withLocalContext}</p>
            <p className="text-xs text-muted-foreground">Local Context</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Health Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Overall Coverage Health</span>
            <span className="text-sm font-bold text-primary">{coverageScore}%</span>
          </div>
          <Progress value={coverageScore} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.strong} strong</span>
            <span>{stats.moderate} moderate</span>
            <span>{stats.weak} weak</span>
            <span>{stats.empty} empty</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="heatmap">
        <TabsList>
          <TabsTrigger value="heatmap">Coverage Heatmap</TabsTrigger>
          <TabsTrigger value="table">Area Details</TabsTrigger>
          <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
        </TabsList>

        {/* Heatmap View */}
        <TabsContent value="heatmap" className="space-y-4">
          {emirateGroups.map(([emirate, emirateAreas]) => {
            const emirateClinicTotal = emirateAreas.reduce((s, a) => s + a.clinicCount, 0);
            return (
              <Card key={emirate}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{emirate}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{emirateAreas.length} areas</Badge>
                      <Badge variant="outline">{emirateClinicTotal} clinics</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {emirateAreas.sort((a, b) => b.clinicCount - a.clinicCount).map(area => {
                      const bgColor = area.health === 'strong' ? 'bg-teal/15 border-teal/30'
                        : area.health === 'moderate' ? 'bg-gold/15 border-gold/30'
                        : area.health === 'weak' ? 'bg-orange-500/15 border-orange-500/30'
                        : 'bg-muted/50 border-border';
                      return (
                        <div
                          key={area.id}
                          className={`rounded-xl border p-3 ${bgColor} transition-all hover:scale-[1.02]`}
                        >
                          <p className="font-semibold text-xs truncate">{area.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">{area.clinicCount} clinics</span>
                            <div className="flex gap-1">
                              {area.hasSeoContent && (
                                <FileText className="h-3 w-3 text-teal" />
                              )}
                              {area.hasLocalContext && (
                                <MapPin className="h-3 w-3 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search areas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={emirateFilter} onValueChange={setEmirateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emirates</SelectItem>
                {stats.emirates.sort().map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead>Emirate</TableHead>
                    <TableHead className="text-center">Clinics</TableHead>
                    <TableHead className="text-center">SEO Content</TableHead>
                    <TableHead className="text-center">Local Context</TableHead>
                    <TableHead className="text-center">Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAreas.map(area => (
                    <TableRow key={area.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{area.name}</span>
                          <a
                            href={area.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{area.emirateAbbr}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{area.clinicCount}</TableCell>
                      <TableCell className="text-center">
                        {area.hasSeoContent ? (
                          <CheckCircle className="h-4 w-4 text-teal mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive/50 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {area.hasLocalContext ? (
                          <CheckCircle className="h-4 w-4 text-teal mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <HealthBadge health={area.health} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Content Gaps */}
        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gold" />
                Priority Content Gaps
              </CardTitle>
              <CardDescription>Areas with clinics but no SEO content — biggest missed opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {areas
                  .filter(a => a.clinicCount > 0 && !a.hasSeoContent)
                  .sort((a, b) => b.clinicCount - a.clinicCount)
                  .slice(0, 20)
                  .map(area => (
                    <div key={area.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{area.name}</p>
                          <p className="text-xs text-muted-foreground">{area.emirate} · {area.clinicCount} clinics</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {area.hasLocalContext ? (
                          <Badge variant="outline" className="text-xs">Local context ready</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">No local context</Badge>
                        )}
                        <HealthBadge health={area.health} />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Missing Local Context
              </CardTitle>
              <CardDescription>Areas without neighborhood-specific content hooks for unique page generation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {areas
                  .filter(a => !a.hasLocalContext)
                  .sort((a, b) => b.clinicCount - a.clinicCount)
                  .map(area => (
                    <div key={area.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{area.name}</p>
                        <p className="text-[10px] text-muted-foreground">{area.emirate}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
