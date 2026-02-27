'use client';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DollarSign, Save, MapPin, Stethoscope, Shield, BarChart3, Settings } from "lucide-react";

export default function PriceComparisonControlTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMin, setEditMin] = useState("");
  const [editMax, setEditMax] = useState("");
  const [filterEmirate, setFilterEmirate] = useState<string>("all");
  const [filterTreatment, setFilterTreatment] = useState<string>("all");

  const { data: priceRanges, isLoading } = useQuery({
    queryKey: ["admin-price-ranges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_price_ranges")
        .select(`*, state:states(id, name, slug), treatment:treatments(id, name, slug)`)
        .order("treatment_id")
        .order("price_min");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: states } = useQuery({
    queryKey: ["admin-states"],
    queryFn: async () => {
      const { data } = await supabase.from("states").select("id, name, slug").eq("is_active", true).order("display_order");
      return data || [];
    },
  });

  const { data: treatments } = useQuery({
    queryKey: ["admin-treatments"],
    queryFn: async () => {
      const { data } = await supabase.from("treatments").select("id, name, slug").eq("is_active", true).order("display_order");
      return data || [];
    },
  });

  const { data: insuranceCoverage } = useQuery({
    queryKey: ["admin-insurance-coverage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_service_coverage")
        .select(`*, insurance:insurances(id, name), treatment:treatments(id, name, slug)`)
        .order("insurance_id");
      if (error) throw error;
      return data || [];
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, price_min, price_max }: { id: string; price_min: number; price_max: number }) => {
      const { error } = await supabase
        .from("service_price_ranges")
        .update({ price_min, price_max } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-price-ranges"] });
      toast.success("Price range updated");
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredRanges = priceRanges?.filter((r: any) => {
    if (filterEmirate !== "all" && r.state?.slug !== filterEmirate) return false;
    if (filterTreatment !== "all" && r.treatment?.slug !== filterTreatment) return false;
    return true;
  });

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditMin(r.price_min?.toString() || "");
    setEditMax(r.price_max?.toString() || "");
  };

  const saveEdit = (id: string) => {
    updatePriceMutation.mutate({ id, price_min: parseFloat(editMin), price_max: parseFloat(editMax) });
  };

  // Stats
  const totalRanges = priceRanges?.length || 0;
  const avgMin = priceRanges?.length ? Math.round(priceRanges.reduce((s: number, r: any) => s + r.price_min, 0) / priceRanges.length) : 0;
  const avgMax = priceRanges?.length ? Math.round(priceRanges.reduce((s: number, r: any) => s + r.price_max, 0) / priceRanges.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">{totalRanges}</div>
          <div className="text-xs text-muted-foreground">Price Ranges</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Stethoscope className="h-5 w-5 text-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">{treatments?.length || 0}</div>
          <div className="text-xs text-muted-foreground">Services</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">AED {avgMin}</div>
          <div className="text-xs text-muted-foreground">Avg Min Price</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-foreground">AED {avgMax}</div>
          <div className="text-xs text-muted-foreground">Avg Max Price</div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="market-prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="market-prices"><DollarSign className="h-4 w-4 mr-1" /> Market Prices</TabsTrigger>
          <TabsTrigger value="insurance-coverage"><Shield className="h-4 w-4 mr-1" /> Insurance Coverage</TabsTrigger>
          <TabsTrigger value="budget-ranges"><Settings className="h-4 w-4 mr-1" /> Budget Ranges</TabsTrigger>
        </TabsList>

        <TabsContent value="market-prices">
          <Card>
            <CardHeader>
              <CardTitle>Service Price Ranges by Emirate</CardTitle>
              <CardDescription>Edit market-level price ranges for each service per emirate</CardDescription>
              <div className="flex gap-3 mt-3">
                <select
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  value={filterEmirate}
                  onChange={(e) => setFilterEmirate(e.target.value)}
                >
                  <option value="all">All Emirates</option>
                  {states?.map((s: any) => <option key={s.id} value={s.slug}>{s.name}</option>)}
                </select>
                <select
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  value={filterTreatment}
                  onChange={(e) => setFilterTreatment(e.target.value)}
                >
                  <option value="all">All Services</option>
                  {treatments?.map((t: any) => <option key={t.id} value={t.slug}>{t.name}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-bold">Service</th>
                        <th className="text-left py-3 px-2 font-bold">Emirate</th>
                        <th className="text-right py-3 px-2 font-bold">Min (AED)</th>
                        <th className="text-right py-3 px-2 font-bold">Max (AED)</th>
                        <th className="text-right py-3 px-2 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRanges?.map((r: any) => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-2">
                            <Badge variant="outline" className="font-bold">{r.treatment?.name}</Badge>
                          </td>
                          <td className="py-3 px-2 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {r.state?.name}
                          </td>
                          {editingId === r.id ? (
                            <>
                              <td className="py-3 px-2 text-right">
                                <Input value={editMin} onChange={(e) => setEditMin(e.target.value)} className="w-24 ml-auto text-right h-8" type="number" />
                              </td>
                              <td className="py-3 px-2 text-right">
                                <Input value={editMax} onChange={(e) => setEditMax(e.target.value)} className="w-24 ml-auto text-right h-8" type="number" />
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button size="sm" onClick={() => saveEdit(r.id)} className="h-7"><Save className="h-3 w-3" /></Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7">Cancel</Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-2 text-right font-mono">{r.price_min?.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right font-mono">{r.price_max?.toLocaleString()}</td>
                              <td className="py-3 px-2 text-right">
                                <Button size="sm" variant="ghost" onClick={() => startEdit(r)} className="h-7 text-xs">Edit</Button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance-coverage">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Coverage by Service</CardTitle>
              <CardDescription>Manage coverage percentages per insurance provider and service</CardDescription>
            </CardHeader>
            <CardContent>
              {insuranceCoverage && insuranceCoverage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-bold">Insurance</th>
                        <th className="text-left py-3 px-2 font-bold">Service</th>
                        <th className="text-right py-3 px-2 font-bold">Coverage %</th>
                        <th className="text-right py-3 px-2 font-bold">Covered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insuranceCoverage.map((ic: any) => (
                        <tr key={ic.id} className="border-b border-border/50">
                          <td className="py-3 px-2">{ic.insurance?.name}</td>
                          <td className="py-3 px-2">{ic.treatment?.name}</td>
                          <td className="py-3 px-2 text-right font-mono">{ic.coverage_percentage}%</td>
                          <td className="py-3 px-2 text-right">
                            <Badge variant={ic.is_covered ? "default" : "destructive"} className="text-xs">
                              {ic.is_covered ? "Yes" : "No"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-bold mb-1">No coverage data yet</p>
                  <p className="text-sm">Add insurance coverage percentages per service to enable the coverage filter for patients</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget-ranges">
          <Card>
            <CardHeader>
              <CardTitle>Budget Slider Ranges</CardTitle>
              <CardDescription>These ranges power the budget filter across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetRangesList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BudgetRangesList() {
  const { data: ranges } = useQuery({
    queryKey: ["admin-budget-ranges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("budget_ranges").select("*").order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-2">
      {ranges?.map((r: any) => (
        <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
          <span className="font-bold text-sm">{r.label}</span>
          <span className="text-sm text-muted-foreground font-mono">
            AED {r.min_value?.toLocaleString() || '0'} – {r.max_value?.toLocaleString() || '∞'}
          </span>
          <Badge variant={r.is_active ? "default" : "secondary"} className="text-xs">
            {r.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ))}
    </div>
  );
}
