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

// Convert to Static Site Generation - OPTIMIZED VERSION
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const citySlug = ctx.params?.citySlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug || !citySlug) {
        return { notFound: true };
    }

    // Fetch state and treatment (for fallback to state service page)
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['state', normalizedStateSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('states')
                    .select('id, name, slug, abbreviation')
                    .eq('slug', normalizedStateSlug)
                    .eq('is_active', true)
                    .maybeSingle();
                return data || null;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ['treatment-match', citySlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('treatments')
                    .select('id, name, slug')
                    .eq('slug', citySlug)
                    .eq('is_active', true)
                    .maybeSingle();
                return data;
            }
        })
    ]);

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    const treatmentMatch = queryClient.getQueryData<any>(['treatment-match', citySlug]);

    // Fetch city only if it's not a treatment match
    if (!treatmentMatch) {
        await queryClient.prefetchQuery({
            queryKey: ['city', citySlug, normalizedStateSlug],
            queryFn: async () => {
                const { data: cities } = await supabase
                    .from('cities')
                    .select('id, name, slug, state_id')
                    .eq('slug', citySlug)
                    .eq('is_active', true)
                    .maybeSingle();
                return cities || null;
            }
        });
    }

    const cityData = queryClient.getQueryData<any>(['city', citySlug, normalizedStateSlug]);
    const seoSlug = `${normalizedStateSlug}/${citySlug}`;

    // Fetch SEO content - simplified
    await queryClient.prefetchQuery({
        queryKey: ['seo-page-content', seoSlug],
        queryFn: async () => {
            const { data } = await supabase
                .from("seo_pages")
                .select("id, slug, meta_title, meta_description, content, is_optimized")
                .or(`slug.eq.${seoSlug},slug.eq./${seoSlug}`)
                .order("is_optimized", { ascending: false })
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            return data || null;
        }
    });

    // Only fetch clinic count if we have city data
    if (cityData) {
        await queryClient.prefetchQuery({
            queryKey: ['city-clinic-count', cityData.id],
            queryFn: async () => {
                const { count } = await supabase
                    .from('clinics')
                    .select('id', { count: 'exact', head: true })
                    .eq('city_id', cityData.id)
                    .eq('is_active', true);
                return count || 0;
            }
        });
    }

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600, // Revalidate every hour (ISR)
    };
};
