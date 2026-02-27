'use client';
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { InsuranceInternalLinks } from "@/components/seo/InsuranceInternalLinks";
import { InsuranceSearch } from "@/components/insurance/InsuranceSearch";
import { InsuranceEducation } from "@/components/insurance/InsuranceEducation";
import { useSeoPageContent } from "@/hooks/useSeoPageContent";
import { buildInsuranceUrl } from "@/lib/url/buildProfileUrl";
import { 
  Shield, ArrowRight, Building2, Users, Phone, Search,
  FileCheck, Sparkles, HeadphonesIcon, Globe, MapPin
} from "lucide-react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const InsurancePage = () => {
  const { data: seoContent } = useSeoPageContent("insurance");
  const [activeGroup, setActiveGroup] = useState<"all" | "local" | "international">("all");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const { data: insurances, isLoading } = useQuery({
    queryKey: ["insurances-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("insurances")
        .select("*")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  const { data: clinicCounts } = useQuery({
    queryKey: ["insurance-clinic-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinic_insurances")
        .select("insurance_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((item) => {
        counts[item.insurance_id] = (counts[item.insurance_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filtered = useMemo(() => {
    let list = insurances || [];
    if (activeGroup === "local") list = list.filter((i: any) => i.insurance_type !== "international");
    if (activeGroup === "international") list = list.filter((i: any) => i.insurance_type === "international");
    if (activeLetter) list = list.filter((i) => i.name.toUpperCase().startsWith(activeLetter));
    return list;
  }, [insurances, activeGroup, activeLetter]);

  const availableLetters = useMemo(() => {
    const letters = new Set((insurances || []).map((i) => i.name[0]?.toUpperCase()));
    return letters;
  }, [insurances]);

  const benefits = [
    { icon: FileCheck, title: "Direct Billing", description: "No upfront payment. We bill your insurance directly." },
    { icon: Sparkles, title: "Pre-Approval", description: "Partner clinics handle insurance pre-approvals." },
    { icon: HeadphonesIcon, title: "Claims Help", description: "Get help with claims and reimbursement." },
  ];

  return (
    <PageLayout>
      <SEOHead
        title={seoContent?.meta_title || "Dental Insurance Accepted - Find Dentists by Insurance | UAE"}
        description={seoContent?.meta_description || "Find dental clinics accepting your insurance in Dubai, Abu Dhabi, Sharjah & across UAE. Direct billing with Daman, AXA, Cigna, Nextcare & 40+ providers."}
        canonical="/insurance/"
        keywords={['dental insurance UAE', 'dentist insurance Dubai', 'Daman dental', 'AXA dental UAE', 'Cigna dental']}
      />

      {/* Hero */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b border-border">
        <div className="container py-12 md:py-16">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Insurance</span>
          </nav>

          <div className="max-w-2xl mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Dental Insurance{" "}
              <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
                Accepted.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Find dentists across the UAE that accept your insurance provider. Direct billing available with {(insurances || []).length}+ providers.
            </p>
            <InsuranceSearch insurances={insurances || []} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters: Type + Alphabetical */}
      <Section size="md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Insurance Providers</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold">Choose Your Provider</h2>
          </div>
          <div className="sm:ml-auto flex gap-2">
            {(["all", "local", "international"] as const).map((group) => (
              <Button
                key={group}
                variant={activeGroup === group ? "default" : "outline"}
                size="sm"
                className="rounded-full capitalize"
                onClick={() => setActiveGroup(group)}
              >
                {group === "all" ? "All" : group === "local" ? (
                  <><MapPin className="h-3.5 w-3.5 mr-1" />Local</>
                ) : (
                  <><Globe className="h-3.5 w-3.5 mr-1" />International</>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Alphabetical Index */}
        <div className="flex flex-wrap gap-1 mb-6 pb-4 border-b border-border">
          <Button
            variant={!activeLetter ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0 rounded-full text-xs"
            onClick={() => setActiveLetter(null)}
          >
            All
          </Button>
          {ALPHABET.map((letter) => (
            <Button
              key={letter}
              variant={activeLetter === letter ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-xs"
              onClick={() => setActiveLetter(letter)}
              disabled={!availableLetters.has(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((insurance) => (
              <Link
                key={insurance.id}
                to={buildInsuranceUrl(insurance.slug)}
                className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {insurance.logo_url ? (
                      <img src={insurance.logo_url} alt={insurance.name} className="h-7 w-7 object-contain" />
                    ) : (
                      <Shield className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ml-auto opacity-0 group-hover:opacity-100" />
                </div>
                <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">
                  {insurance.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Building2 className="h-3 w-3" />
                  <span>{clinicCounts?.[insurance.id] || 0} clinics</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl border border-dashed border-border">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">No Providers Found</h3>
            <p className="text-sm text-muted-foreground">
              {activeLetter ? `No providers starting with "${activeLetter}".` : "Try adjusting your filters."}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setActiveLetter(null); setActiveGroup("all"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </Section>

      {/* Educational Section */}
      <Section variant="muted" size="md">
        <InsuranceEducation />
      </Section>

      {/* Internal Links - SEO */}
      <Section size="md">
        <InsuranceInternalLinks showInsurances={false} />
      </Section>

      {/* CTA */}
      <Section size="sm">
        <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary/5 to-teal/5 border border-primary/20 text-center">
          <Users className="h-10 w-10 text-primary mx-auto mb-3" />
          <h2 className="font-display text-xl md:text-2xl font-bold mb-2">
            Don't See Your Insurance?
          </h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Contact us and we'll help you find clinics that accept your provider.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-xl font-bold" size="sm">
              <Link to="/contact/">
                <Phone className="h-4 w-4 mr-2" />
                Contact Us
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl font-bold" size="sm">
              <Link to="/search/">
                <Search className="h-4 w-4 mr-2" />
                Browse Clinics
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
};

export default InsurancePage;
