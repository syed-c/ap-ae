import { GetStaticProps, GetStaticPaths } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import CityPageComponent from '@/pages/CityPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

export default CityPageComponent;

// Generate static paths for all emirate-area combinations at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    // Get all active states and cities
    const { data: cities } = await supabase
        .from('cities')
        .select('slug, state:states!inner(slug)')
        .eq('is_active', true)
        .eq('state.is_active', true);
    
    // OPTIMIZATION: Only pre-render top cities at build time
    // This significantly reduces build time
    const TOP_CITIES_LIMIT = 20; // Only pre-render top 20 cities
    
    // Get clinic counts per city
    const { data: cityClinics } = await supabase
        .from('clinics')
        .select('city_id');
    
    const cityCountMap = new Map<string, number>();
    (cityClinics || []).forEach((c: any) => {
        const count = cityCountMap.get(c.city_id) || 0;
        cityCountMap.set(c.city_id, count + 1);
    });
    
    const citiesWithCounts = (cities || []).map(city => ({
        ...city,
        clinicCount: cityCountMap.get(city.id) || 0
    })).sort((a: any, b: any) => b.clinicCount - a.clinicCount);
    
    const topCities = citiesWithCounts.slice(0, TOP_CITIES_LIMIT);
    
    const paths = topCities.map(city => ({
        params: { 
            stateSlug: city.state.slug,
            citySlug: city.slug 
        }
    }));
    
    console.log(`[SSG] Generated ${paths.length} area page paths (top ${TOP_CITIES_LIMIT} cities). Total available: ${cities?.length || 0}. Rest will be ISR.`);
    
    return {
        paths,
        fallback: 'blocking' // Generate pages on-demand if not built initially
    };
};

// Convert to Static Site Generation - FULL DATA PREFETCH FOR SEO
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const citySlug = ctx.params?.citySlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug || !citySlug) {
        return { notFound: true };
    }

    // Fetch state
    await queryClient.prefetchQuery({
        queryKey: ['state', normalizedStateSlug],
        queryFn: async () => {
            const { data } = await supabase
                .from('states')
                .select('*')
                .eq('slug', normalizedStateSlug)
                .eq('is_active', true)
                .maybeSingle();
            return data || null;
        }
    });

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    if (!stateData) {
        return { notFound: true };
    }

    // Check if citySlug matches a treatment (for state service page fallback)
    await queryClient.prefetchQuery({
        queryKey: ['treatment-match', citySlug],
        queryFn: async () => {
            const { data } = await supabase
                .from('treatments')
                .select('id, name, slug, description')
                .eq('slug', citySlug)
                .eq('is_active', true)
                .maybeSingle();
            return data;
        }
    });

    const treatmentMatch = queryClient.getQueryData<any>(['treatment-match', citySlug]);

    // Fetch city only if not a treatment match
    if (!treatmentMatch) {
        await queryClient.prefetchQuery({
            queryKey: ['city', citySlug, normalizedStateSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('cities')
                    .select('*, state:states(*)')
                    .eq('slug', citySlug)
                    .eq('is_active', true)
                    .maybeSingle();
                return data || null;
            }
        });
    }

    const cityData = queryClient.getQueryData<any>(['city', citySlug, normalizedStateSlug]);
    const seoSlug = `${normalizedStateSlug}/${citySlug}`;

    // Fetch SEO content, treatments, and other data IN PARALLEL
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['seo-page-content', seoSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("seo_pages")
                    .select("*")
                    .or(`slug.eq.${seoSlug},slug.eq./${seoSlug}`)
                    .order("is_optimized", { ascending: false })
                    .order("updated_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                return data || null;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ["treatments"],
            queryFn: async () => {
                const { data } = await supabase
                    .from("treatments")
                    .select("*")
                    .eq("is_active", true)
                    .order("display_order");
                return data || [];
            },
        }),
        queryClient.prefetchQuery({
            queryKey: ['cities-by-state', normalizedStateSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('cities')
                    .select('*, state:states(*)')
                    .eq('state_id', stateData.id)
                    .eq('is_active', true)
                    .order('name');
                return data || [];
            }
        })
    ]);

    // If we have city data, fetch city-specific data
    if (cityData) {
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: ['city-clinic-count', cityData.id],
                queryFn: async () => {
                    const { count } = await supabase
                        .from('clinics')
                        .select('id', { count: 'exact', head: true })
                        .eq('city_id', cityData.id)
                        .eq('is_active', true);
                    return count || 0;
                }
            }),
            queryClient.prefetchQuery({
                queryKey: ['pinned-profiles', 'city', normalizedStateSlug, citySlug],
                queryFn: async () => {
                    const { data } = await supabase
                        .from('pinned_profiles')
                        .select('*')
                        .eq('entity_type', 'city')
                        .eq('entity_slug', citySlug)
                        .eq('is_active', true)
                        .order('display_order');
                    return data || [];
                }
            })
        ]);

        const pinnedProfiles = queryClient.getQueryData<any>(['pinned-profiles', 'city', normalizedStateSlug, citySlug]);
        const pinnedIds = pinnedProfiles?.map((p: any) => p.profile_id) || [];

        // Fetch city profiles (clinics)
        await queryClient.prefetchQuery({
            queryKey: ['city-profiles', citySlug, pinnedIds.join(',')],
            queryFn: async () => {
                const { data: clinics } = await supabase
                    .from('clinics')
                    .select(`
            id, name, slug, description, cover_image_url, rating, review_count,
            address, phone, verification_status, claim_status,
            city:cities(name, slug, state:states(name, abbreviation))
          `)
                    .eq('city_id', cityData.id)
                    .eq('is_active', true)
                    .order('rating', { ascending: false })
                    .limit(50);

                let pinnedClinics: any[] = [];
                if (pinnedIds && pinnedIds.length > 0) {
                    const resultIds = new Set((clinics || []).map((c: any) => c.id));
                    const missingPinnedIds = pinnedIds.filter((id: string) => !resultIds.has(id));

                    if (missingPinnedIds.length > 0) {
                        const { data: extraPinned } = await supabase
                            .from('clinics')
                            .select(`
                id, name, slug, description, cover_image_url, rating, review_count,
                address, phone, verification_status, claim_status,
                city:cities(name, slug, state:states(name, abbreviation))
              `)
                            .in('id', missingPinnedIds)
                            .eq('is_active', true);
                        pinnedClinics = extraPinned || [];
                    }
                }

                const seenIds = new Set<string>();
                const allClinics = [...(clinics || []), ...pinnedClinics].filter((c: any) => {
                    if (seenIds.has(c.id)) return false;
                    seenIds.add(c.id);
                    return true;
                });

                return allClinics.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    type: 'clinic',
                    specialty: 'Dental Clinic',
                    location: c.city ? `${c.city.name}, ${c.city.state?.abbreviation || ''}` : '',
                    rating: c.rating || 0,
                    reviewCount: c.review_count || 0,
                    image: c.cover_image_url,
                    isVerified: c.verification_status === 'verified',
                    isClaimed: c.claim_status === 'claimed',
                    isPinned: false,
                }));
            }
        });
    } else if (treatmentMatch) {
        // State service page case - fetch price ranges and profiles
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: ['service-price-ranges', citySlug],
                queryFn: async () => {
                    const { data: ranges } = await supabase
                        .from('service_price_ranges')
                        .select(`
                          id, price_min, price_max, state_id,
                          state:states(id, name, slug)
                        `)
                        .eq('treatment_id', treatmentMatch.id);

                    if (!ranges || ranges.length === 0) return [];

                    const latestPerState = ranges.reduce((acc: any, current: any) => {
                        if (!acc[current.state_id]) {
                            acc[current.state_id] = current;
                        }
                        return acc;
                    }, {});

                    return Object.values(latestPerState);
                }
            }),
            queryClient.prefetchQuery({
                queryKey: ['state-service-profiles', stateData.id, treatmentMatch.id],
                queryFn: async () => {
                    const { data: stateCities } = await supabase
                        .from('cities')
                        .select('id')
                        .eq('state_id', stateData.id)
                        .eq('is_active', true);

                    if (!stateCities?.length) return [];
                    const cityIds = stateCities.map(c => c.id);

                    const { data: clinics } = await supabase
                        .from('clinics')
                        .select(`
                                id, name, slug, description, cover_image_url, rating, review_count,
                                address, phone, verification_status, claim_status,
                                city:cities(name, slug, state:states(name, abbreviation))
                            `)
                        .in('city_id', cityIds)
                        .eq('is_active', true)
                        .order('rating', { ascending: false })
                        .limit(50);

                    return (clinics || []).map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        slug: c.slug,
                        type: 'clinic',
                        specialty: treatmentMatch.name,
                        location: c.city ? `${c.city.name}, ${c.city.state?.name || ''}` : '',
                        rating: c.rating || 0,
                        reviewCount: c.review_count || 0,
                        image: c.cover_image_url,
                        isVerified: c.verification_status === 'verified',
                        isClaimed: c.claim_status === 'claimed',
                        isPinned: false,
                    }));
                }
            })
        ]);
    }

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600,
    };
};
