'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Search, Stethoscope, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCitiesByStateSlug, useCities } from "@/hooks/useLocations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchBoxProps {
  variant?: "default" | "compact" | "hero";
  defaultCity?: string;
  defaultTreatment?: string;
  stateSlug?: string;
  showInsurance?: boolean;
}

interface SearchOption {
  value: string;
  label: string;
  slug?: string;
  stateSlug?: string;
}

function fuzzyScore(query: string, label: string): number {
  const q = query.toLowerCase().trim();
  const l = label.toLowerCase();
  if (!q) return 1;
  if (l === q) return 100;
  if (l.startsWith(q)) return 90;
  if (l.includes(q)) return 70;
  const words = l.split(/[\s,]+/);
  let bestWordScore = 0;
  for (const word of words) {
    const dist = levenshtein(q, word.slice(0, q.length + 2));
    const maxLen = Math.max(q.length, word.length);
    const similarity = maxLen > 0 ? (1 - dist / maxLen) * 60 : 0;
    bestWordScore = Math.max(bestWordScore, similarity);
  }
  let qi = 0;
  for (let li = 0; li < l.length && qi < q.length; li++) {
    if (l[li] === q[qi]) qi++;
  }
  const subseqScore = qi === q.length ? 40 : (qi / q.length) * 20;
  return Math.max(bestWordScore, subseqScore);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const headingFont = "'Varela Round', 'Quicksand', system-ui, sans-serif";

function SmartSearchInput({
  placeholder,
  options,
  value,
  onChange,
  icon: Icon,
  className = "",
}: {
  placeholder: string;
  options: SearchOption[];
  value: string;
  onChange: (value: string, label: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const option = options.find(o => o.value === value);
      setDisplayValue(option?.label || value);
      setQuery(option?.label || value);
    } else {
      setDisplayValue("");
      setQuery("");
    }
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options.slice(0, 15);
    return options
      .map(o => ({ ...o, score: fuzzyScore(query, o.label) }))
      .filter(o => o.score > 15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, [query, options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(displayValue);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [displayValue]);

  const handleSelect = (option: SearchOption) => {
    onChange(option.value, option.label);
    setQuery(option.label);
    setDisplayValue(option.label);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("", "");
    setQuery("");
    setDisplayValue("");
    inputRef.current?.focus();
  };

  const highlightMatch = useCallback((label: string) => {
    if (!query.trim()) return label;
    const idx = label.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return label;
    return (
      <>
        {label.slice(0, idx)}
        <span className="text-primary font-bold">{label.slice(idx, idx + query.length)}</span>
        {label.slice(idx + query.length)}
      </>
    );
  }, [query]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-4 h-5 w-5 text-primary/60 pointer-events-none z-10" />}
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`${Icon ? 'pl-12' : ''} pr-9 h-14 rounded-2xl border-border/50 bg-background text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/40 placeholder:text-muted-foreground/50`}
        />
        {query && (
          <button onClick={handleClear} className="absolute right-3.5 p-1.5 rounded-full hover:bg-muted transition-colors z-10">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl max-h-[280px] overflow-auto">
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option)}
              className="w-full text-left px-5 py-3 hover:bg-primary/5 transition-colors text-sm text-foreground flex items-center gap-2.5 first:rounded-t-2xl last:rounded-b-2xl"
            >
              {Icon && <Icon className="h-4 w-4 text-muted-foreground/50 shrink-0" />}
              <span>{highlightMatch(option.label)}</span>
            </button>
          ))}
        </div>
      )}
      {isOpen && query.trim().length >= 2 && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground">No results for "{query}"</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try a different spelling</p>
        </div>
      )}
    </div>
  );
}

export function SearchBox({
  variant = "default",
  defaultCity,
  defaultTreatment,
  stateSlug: propStateSlug,
  showInsurance = true,
}: SearchBoxProps) {
  const navigate = useNavigate();
  const { stateSlug: routeStateSlug, citySlug: routeCitySlug } = useParams();
  const [city, setCity] = useState<string>(defaultCity ?? "");
  const [_cityLabel, setCityLabel] = useState<string>("");
  const [treatment, setTreatment] = useState<string>(defaultTreatment ?? "");
  const [_treatmentLabel, setTreatmentLabel] = useState<string>("");
  const [insurance, setInsurance] = useState<string>("");
  const [_insuranceLabel, setInsuranceLabel] = useState<string>("");

  const stateContext = propStateSlug || routeStateSlug;
  const { data: stateCitiesData } = useCitiesByStateSlug(stateContext || '');
  const { data: allCitiesData } = useCities();
  const citiesData = stateContext && stateCitiesData?.length ? stateCitiesData : allCitiesData;

  const { data: treatmentsData } = useQuery({
    queryKey: ['search-treatments'],
    queryFn: async () => {
      const { data } = await supabase.from('treatments').select('id, name, slug').eq('is_active', true).order('display_order');
      return data || [];
    },
  });

  const { data: insurancesData } = useQuery({
    queryKey: ['search-insurances'],
    queryFn: async () => {
      const { data } = await supabase.from('insurances').select('id, name, slug').eq('is_active', true).order('name');
      return data || [];
    },
    enabled: showInsurance,
  });

  useEffect(() => {
    if (routeCitySlug && stateContext && citiesData?.length && !city) {
      const matchingCity = citiesData.find(c => c.slug === routeCitySlug);
      if (matchingCity) {
        const value = `${matchingCity.slug}|${stateContext}`;
        setCity(value);
        setCityLabel(`${matchingCity.name}${(matchingCity as any).state?.abbreviation ? `, ${(matchingCity as any).state?.abbreviation}` : ''}`);
      }
    }
  }, [routeCitySlug, stateContext, citiesData, city]);

  useEffect(() => { if (defaultCity && !city) setCity(defaultCity); }, [defaultCity, city]);
  useEffect(() => { if (defaultTreatment && !treatment) setTreatment(defaultTreatment); }, [defaultTreatment, treatment]);

  const cityOptions: SearchOption[] = useMemo(() =>
    citiesData?.map(c => ({
      value: `${c.slug}|${(c as any).state?.slug || ''}`,
      label: `${c.name}${(c as any).state?.abbreviation ? `, ${(c as any).state?.abbreviation}` : ''}`,
      slug: c.slug,
      stateSlug: (c as any).state?.slug || '',
    })) || [],
    [citiesData]);

  const treatmentOptions: SearchOption[] = useMemo(() =>
    treatmentsData?.map(t => ({ value: t.slug, label: t.name, slug: t.slug })) || [],
    [treatmentsData]);

  const insuranceOptions: SearchOption[] = useMemo(() =>
    insurancesData?.map(ins => ({ value: ins.slug || '', label: ins.name, slug: ins.slug || undefined })) || [],
    [insurancesData]);

  const handleSearch = () => {
    if (city) {
      const [citySlug, targetStateSlug] = city.split('|');
      if (insurance) {
        const params = new URLSearchParams();
        params.set('city', citySlug);
        params.set('state', targetStateSlug);
        if (treatment) params.set('treatment', treatment);
        navigate(`/insurance/${insurance}?${params.toString()}`);
        return;
      }
      if (treatment) {
        navigate(`/${targetStateSlug}/${citySlug}/${treatment}`);
      } else {
        navigate(`/${targetStateSlug}/${citySlug}`);
      }
    } else if (insurance) {
      navigate(`/insurance/${insurance}`);
    } else if (stateContext) {
      navigate(`/${stateContext}`);
    } else {
      navigate('/search');
    }
  };

  if (variant === "hero") {
    return (
      <div className="bg-card/90 backdrop-blur-xl border border-border/20 rounded-[1.75rem] p-5 md:p-7 shadow-2xl shadow-black/25">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2.5 block px-1" style={{ fontFamily: headingFont }}>
              📍 Location
            </label>
            <SmartSearchInput
              placeholder="Emirate, city, area..."
              options={cityOptions}
              value={city}
              onChange={(val, label) => { setCity(val); setCityLabel(label); }}
              icon={MapPin}
            />
          </div>
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2.5 block px-1" style={{ fontFamily: headingFont }}>
              🦷 Service
            </label>
            <SmartSearchInput
              placeholder="Treatment type..."
              options={treatmentOptions}
              value={treatment}
              onChange={(val, label) => { setTreatment(val); setTreatmentLabel(label); }}
              icon={Stethoscope}
            />
          </div>
          <div>
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2.5 block px-1" style={{ fontFamily: headingFont }}>
              🛡️ Insurance
            </label>
            <SmartSearchInput
              placeholder="Your insurance..."
              options={insuranceOptions}
              value={insurance}
              onChange={(val, label) => { setInsurance(val); setInsuranceLabel(label); }}
              icon={Shield}
            />
          </div>
        </div>
        <Button
          onClick={handleSearch}
          size="lg"
          className="w-full h-16 mt-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg gap-3 shadow-xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99]"
          style={{ fontFamily: headingFont }}
        >
          <Search className="h-6 w-6" />
          Find Dentists Now
        </Button>
      </div>
    );
  }

  // Default/Compact variant
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">City</label>
          <SmartSearchInput placeholder="Search any city..." options={cityOptions} value={city} onChange={(val, label) => { setCity(val); setCityLabel(label); }} icon={MapPin} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">Treatment</label>
          <SmartSearchInput placeholder="Search treatment..." options={treatmentOptions} value={treatment} onChange={(val, label) => { setTreatment(val); setTreatmentLabel(label); }} icon={Stethoscope} />
        </div>
        {showInsurance && (
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">Insurance</label>
            <SmartSearchInput placeholder="Search insurance..." options={insuranceOptions} value={insurance} onChange={(val, label) => { setInsurance(val); setInsuranceLabel(label); }} icon={Shield} />
          </div>
        )}
        <div className="flex items-end">
          <Button onClick={handleSearch} size="lg" className="h-14 w-full rounded-xl font-bold gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
      </div>
    </div>
  );
}
