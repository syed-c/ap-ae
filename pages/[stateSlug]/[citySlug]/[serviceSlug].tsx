import { GetStaticProps, GetStaticPaths } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import ServiceLocationPage from '@/pages/ServiceLocationPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

export default ServiceLocationPage;

// Generate static paths for emirate-area-service combinations
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    console.log('[SSG] Generating area-service paths...');
    
    // Get all active treatments
    const { data: treatments } = await supabase
        .from('treatments')
        .select('slug')
        .eq('is_active', true);
    
    if (!treatments || treatments.length === 0) {
        console.log('[SSG] No treatments found');
        return { paths: [], fallback: 'blocking' };
    }
    
    const treatmentSlugs = treatments.map(t => t.slug);
    
    // Get all cities with their states
    const { data: cities } = await supabase
        .from('cities')
        .select('slug, state:states!inner(slug)')
        .eq('is_active', true)
        .eq('state.is_active', true);
    
    if (!cities || cities.length === 0) {
        console.log('[SSG] No cities found');
        return { paths: [], fallback: 'blocking' };
    }
    
    // OPTIMIZATION: Only generate paths for TOP cities to speed up build
    // Other city+service combinations will be generated on-demand (ISR)
    // This reduces build time from hours to minutes
    const TOP_CITIES_LIMIT = 10; // Only pre-render top 10 cities
    
    // Get top cities by clinic count
    const { data: cityClinicCounts } = await supabase
        .from('clinics')
        .select('city_id')
        .eq('is_active', true);
    
    const cityCountMap = new Map<string, number>();
    (cityClinicCounts || []).forEach((c: any) => {
        const count = cityCountMap.get(c.city_id) || 0;
        cityCountMap.set(c.city_id, count + 1);
    });
    
    const citiesWithCounts = cities.map(city => ({
        ...city,
        clinicCount: cityCountMap.get(city.id) || 0
    })).sort((a: any, b: any) => b.clinicCount - a.clinicCount);
    
    const topCities = citiesWithCounts.slice(0, TOP_CITIES_LIMIT);
    const topCitySlugs = new Set(topCities.map((c: any) => c.slug));
    
    // Generate paths only for top cities (build-time generation)
    // Other cities will be generated on-demand
    const paths: any[] = [];
    
    for (const city of topCities) {
        for (const treatmentSlug of treatmentSlugs) {
            paths.push({
                params: {
                    stateSlug: city.state.slug,
                    citySlug: city.slug,
                    serviceSlug: treatmentSlug
                }
            });
        }
    }
    
    console.log(`[SSG] Generated ${paths.length} area-service paths for top ${topCities.length} cities (build-time). Total combinations: ${cities.length * treatmentSlugs.length}. Other pages will be ISR.`);
    
    return {
        paths,
        fallback: 'blocking' // Generate other combinations on-demand
    };
};

// Convert to Static Site Generation - OPTIMIZED VERSION
// Only fetches essential data; rest is fetched client-side via React Query
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const citySlug = ctx.params?.citySlug as string;
    const serviceSlug = ctx.params?.serviceSlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug || !citySlug || !serviceSlug) {
        return { notFound: true };
    }

    // Only fetch essential data for initial render
    // Client-side will fetch additional data
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["treatment", serviceSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("treatments")
                    .select("id, name, slug, description")
                    .eq("slug", serviceSlug)
                    .maybeSingle();
                return data;
            },
        }),
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
    ]);

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    const treatmentData = queryClient.getQueryData<any>(['treatment', serviceSlug]);

    if (!stateData || !treatmentData) {
        return { notFound: true };
    }

    // Fetch city separately
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

    const cityData = queryClient.getQueryData<any>(['city', citySlug, normalizedStateSlug]);
    if (!cityData) {
        return { notFound: true };
    }

    // SEO content - simplified to single query
    const seoSlug = `${normalizedStateSlug}/${citySlug}/${serviceSlug}`;
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

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600, // Revalidate every hour (ISR)
    };
};
