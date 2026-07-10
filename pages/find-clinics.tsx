import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Search, SlidersHorizontal, MapPin, Star, ChevronDown, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { ClinicCard } from '@/components/ClinicCard';
import { emirates, specialties, insurers, SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';
import { supabase } from '@/integrations/supabase/client';

interface RawClinic {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  average_rating: number;
  total_reviews: number;
  city_id: string | null;
}

export default function FindClinicsPage() {
  const [clinics, setClinics] = useState<RawClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmirates, setSelectedEmirates] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      const dentalKeywords = ['dental', 'dentist', 'dentistry', 'orthodont', 'smile', 'oral', 'endodont', 'periodont', 'veneers', 'invisalign', 'braces', 'teeth'];
      const q = supabase
        .from('clinics')
        .select('id, name, slug, cover_image_url, average_rating, total_reviews, city_id')
        .eq('is_active', true)
        .or(dentalKeywords.map(k => 'name.ilike.%' + k + '%').join(','))
        .order('total_reviews', { ascending: false });

      const { data } = await q.limit(200);
      setClinics(data || []);
      setLoading(false);
    };
    fetchClinics();
  }, []);

  // Get cities for mapping
  const [cityNames, setCityNames] = useState<Record<string, string>>({});
  const [cityStates, setCityStates] = useState<Record<string, string>>({});
  const [stateSlugs, setStateSlugs] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('cities').select('id, name, state_id').eq('is_active', true).then(({ data }) => {
      const names: Record<string, string> = {};
      const states: Record<string, string> = {};
      (data || []).forEach(c => { names[c.id] = c.name; states[c.id] = c.state_id; });
      setCityNames(names);
      setCityStates(states);
    });
    supabase.from('states').select('id, name, slug').eq('is_active', true).then(({ data }) => {
      const slugs: Record<string, string> = {};
      (data || []).forEach(s => { slugs[s.id] = s.slug; });
      setStateSlugs(slugs);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = [...clinics];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }
    if (selectedEmirates.length > 0) {
      result = result.filter(c => {
        if (!c.city_id) return false;
        const stateId = cityStates[c.city_id];
        const slug = stateSlugs[stateId];
        return slug && selectedEmirates.includes(slug);
      });
    }
    return result;
  }, [clinics, searchQuery, selectedEmirates, cityStates, stateSlugs]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleFilter = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  return (
    <PageLayout>
      <Head>
        <title>Find a Dentist — {SITE_NAME}.ae</title>
        <meta name="description" content={`Browse verified dental clinics across all 7 UAE emirates. Filter by specialty, insurance, price, and rating. Book instantly.`} />
        <meta property="og:title" content={`Find a Dentist — ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Search and compare dental clinics across the UAE." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="Find your perfect clinic"
        title="Search dental clinics"
        subtitle={`Browse verified clinics across all 7 emirates`}
      >
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by clinic name..."
            className="w-full h-12 pl-11 pr-4 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 text-sm flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </h3>
                <button onClick={() => { setSelectedEmirates([]); setSearchQuery(''); }} className="text-xs text-amber-700 hover:text-amber-800 font-medium">
                  Reset
                </button>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Emirate</h4>
                <div className="space-y-1.5">
                  {emirates.map(e => (
                    <label key={e.slug} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedEmirates.includes(e.slug)}
                        onChange={() => { setSelectedEmirates(toggleFilter(selectedEmirates, e.slug)); setPage(1); }}
                        className="w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500/30"
                      />
                      <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">{e.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-zinc-500">
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</span>
                ) : (
                  <><span className="font-semibold text-zinc-900">{filtered.length}</span> clinics found</>
                )}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
              </div>
            ) : paginated.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="font-semibold text-zinc-900">No clinics match your filters</h3>
                <p className="text-zinc-500 text-sm mt-2">Try adjusting your search or filters.</p>
                <button onClick={() => { setSelectedEmirates([]); setSearchQuery(''); }} className="mt-4 text-sm font-semibold text-amber-700 hover:text-amber-800">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginated.map(clinic => {
                  const cityName = clinic.city_id ? cityNames[clinic.city_id] : null;
                  const stateId = clinic.city_id ? cityStates[clinic.city_id] : null;
                  const stateName = stateId ? emirates.find(e => e.slug === stateSlugs[stateId])?.name : null;
                  const location = [cityName, stateName].filter(Boolean).join(', ') || 'UAE';
                  return (
                    <ClinicCard
                      key={clinic.id}
                      slug={clinic.slug}
                      name={clinic.name}
                      location={location}
                      rating={clinic.average_rating || 0}
                      reviewCount={clinic.total_reviews || 0}
                      coverImageUrl={clinic.cover_image_url}
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium border border-zinc-200 rounded-full hover:bg-zinc-100 transition-colors disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 text-sm font-medium rounded-full transition-colors ${page === i + 1 ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium border border-zinc-200 rounded-full hover:bg-zinc-100 transition-colors disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
