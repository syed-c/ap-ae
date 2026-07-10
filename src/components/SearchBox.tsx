'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Search, MapPin, Stethoscope, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTreatments } from '@/hooks/useTreatments';
import { useStates, useCities } from '@/hooks/useLocations';

interface SearchBoxProps {
  variant?: 'hero' | 'compact';
  className?: string;
  onSearch?: (params: { location: string; treatment: string; insurance: string }) => void;
  stateSlug?: string;
  defaultCity?: string;
  defaultTreatment?: string;
}

interface FuzzyOption {
  id: string;
  label: string;
  slug: string;
  type: 'state' | 'city' | 'treatment' | 'insurance';
  group: string;
}

function fuzzyMatch(text: string, query: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  const qWords = q.split(/\s+/);
  return qWords.every((word) => t.includes(word));
}

export function SearchBox({ variant = 'compact', className, onSearch }: SearchBoxProps) {
  const router = useRouter();
  const { data: treatments } = useTreatments();
  const { data: states } = useStates();
  const { data: cities } = useCities();

  const [location, setLocation] = useState('');
  const [treatment, setTreatment] = useState('');
  const [insurance, setInsurance] = useState('');
  const [focusedField, setFocusedField] = useState<'location' | 'treatment' | 'insurance' | null>(null);

  const locationRef = useRef<HTMLDivElement>(null);
  const treatmentRef = useRef<HTMLDivElement>(null);
  const insuranceRef = useRef<HTMLDivElement>(null);

  const { data: insurances } = useQuery({
    queryKey: ['searchbox-insurances'],
    queryFn: async () => {
      const { data } = await supabase
        .from('insurances')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order');
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const insuranceOptions = useMemo(() => (insurances || []).map(ins => ({
    id: ins.id, label: ins.name, slug: ins.slug
  })), [insurances]);

  const allOptions = useMemo(() => {
    const opts: FuzzyOption[] = [];

    (states || []).forEach((s) => {
      opts.push({ id: s.id, label: s.name, slug: s.slug, type: 'state', group: 'Emirates' });
    });
    (cities || []).forEach((c) => {
      opts.push({ id: c.id, label: `${c.name}${c.state ? `, ${c.state.abbreviation}` : ''}`, slug: c.slug, type: 'city', group: 'Cities' });
    });
    (treatments || []).forEach((t) => {
      opts.push({ id: t.id, label: t.name, slug: t.slug, type: 'treatment', group: 'Treatments' });
    });
    insuranceOptions.forEach((ins) => {
      opts.push({ id: ins.id, label: ins.label, slug: ins.slug, type: 'insurance', group: 'Insurance' });
    });

    return opts;
  }, [states, cities, treatments]);

  const filteredLocation = useMemo(() => {
    if (!location || !focusedField || focusedField !== 'location') return [];
    return allOptions
      .filter((o) => (o.type === 'state' || o.type === 'city') && fuzzyMatch(o.label, location))
      .slice(0, 6);
  }, [location, focusedField, allOptions]);

  const filteredTreatment = useMemo(() => {
    if (!treatment || !focusedField || focusedField !== 'treatment') return [];
    return allOptions
      .filter((o) => o.type === 'treatment' && fuzzyMatch(o.label, treatment))
      .slice(0, 6);
  }, [treatment, focusedField, allOptions]);

  const filteredInsurance = useMemo(() => {
    if (!insurance || !focusedField || focusedField !== 'insurance') return [];
    return allOptions
      .filter((o) => o.type === 'insurance' && fuzzyMatch(o.label, insurance))
      .slice(0, 6);
  }, [insurance, focusedField, allOptions]);

  const handleSelect = useCallback((option: FuzzyOption, field: 'location' | 'treatment' | 'insurance') => {
    if (field === 'location') setLocation(option.label);
    else if (field === 'treatment') setTreatment(option.label);
    else if (field === 'insurance') setInsurance(option.label);
    setFocusedField(null);
  }, []);

  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch({ location, treatment, insurance });
      return;
    }

    const params = new URLSearchParams();
    if (location) params.set('q', location);
    if (treatment) params.set('treatment', treatment);
    if (insurance) params.set('insurance', insurance);
    router.push(`/search/?${params.toString()}`);
  }, [location, treatment, insurance, onSearch, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !locationRef.current?.contains(e.target as Node) &&
        !treatmentRef.current?.contains(e.target as Node) &&
        !insuranceRef.current?.contains(e.target as Node)
      ) {
        setFocusedField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inputBase = cn(
    'w-full h-11 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground',
    'focus:outline-none focus:border-primary transition-all duration-300 pl-9 pr-3',
  );

  const dropdown = (filtered: FuzzyOption[], field: 'location' | 'treatment' | 'insurance') => {
    if (filtered.length === 0) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.04),0_10px_15px_rgba(0,0,0,0.06)] z-50 overflow-hidden">
        {filtered.map((opt) => (
          <button
            key={`${opt.type}-${opt.id}`}
            type="button"
            onClick={() => handleSelect(opt, field)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-primary-light transition-all duration-300 text-left"
          >
            {opt.label}
            <span className="ml-auto text-[10px] uppercase tracking-wider text-primary">{opt.group}</span>
          </button>
        ))}
      </div>
    );
  };

  if (variant === 'hero') {
    return (
      <div className={cn('bg-white/80 backdrop-blur-xl border border-border/60 rounded-2xl p-4 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_6px_rgba(0,0,0,0.04)]', className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Location */}
          <div ref={locationRef} className="relative">
            <label className="block text-xs font-medium text-muted mb-1.5">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setFocusedField('location')}
                placeholder="Emirate or city..."
                className={inputBase}
              />
              {location && (
                <button onClick={() => { setLocation(''); setFocusedField(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-all duration-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {dropdown(filteredLocation, 'location')}
          </div>

          {/* Treatment */}
          <div ref={treatmentRef} className="relative">
            <label className="block text-xs font-medium text-muted mb-1.5">Treatment</label>
            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                onFocus={() => setFocusedField('treatment')}
                placeholder="Dental service..."
                className={inputBase}
              />
              {treatment && (
                <button onClick={() => { setTreatment(''); setFocusedField(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-all duration-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {dropdown(filteredTreatment, 'treatment')}
          </div>

          {/* Insurance */}
          <div ref={insuranceRef} className="relative">
            <label className="block text-xs font-medium text-muted mb-1.5">Insurance</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                onFocus={() => setFocusedField('insurance')}
                placeholder="Provider (optional)..."
                className={inputBase}
              />
              {insurance && (
                <button onClick={() => { setInsurance(''); setFocusedField(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-all duration-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {dropdown(filteredInsurance, 'insurance')}
          </div>
        </div>

        <div className="mt-3">
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" />
            Find Dentist
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col sm:flex-row gap-2', className)}>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onFocus={() => setFocusedField('location')}
          placeholder="Emirate, city..."
          className="w-full h-10 pl-9 pr-3 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-300"
        />
      </div>
      <div className="relative flex-1">
        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          onFocus={() => setFocusedField('treatment')}
          placeholder="Treatment"
          className="w-full h-10 pl-9 pr-3 bg-white border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-300"
        />
      </div>
      <Button variant="default" onClick={handleSearch} className="h-10">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </div>
  );
}
