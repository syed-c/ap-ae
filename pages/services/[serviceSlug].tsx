import { GetStaticProps, GetStaticPaths } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import ServicePageComponent from '@/pages/ServicePage';

export default ServicePageComponent;

// Generate static paths for all service pages at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    const { data: treatments } = await supabase
        .from('treatments')
        .select('slug')
        .eq('is_active', true);
    
    const paths = (treatments || []).map(treatment => ({
        params: { serviceSlug: treatment.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} service page paths`);
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Convert to Static Site Generation - FULL DATA PREFETCH FOR SEO
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const serviceSlug = ctx.params?.serviceSlug as string;

    if (!serviceSlug) {
        return { notFound: true };
    }

    // Fetch treatment
    await queryClient.prefetchQuery({
        queryKey: ['treatment', serviceSlug],
        queryFn: async () => {
            const { data } = await supabase
                .from('treatments')
                .select('*')
                .eq('slug', serviceSlug)
                .maybeSingle();
            return data || null;
        }
    });

    const treatment = queryClient.getQueryData<any>(['treatment', serviceSlug]);
    if (!treatment) {
        return { notFound: true };
    }

    // Fetch SEO content, related treatments, states, and profiles IN PARALLEL
    const seoSlug = `services/${serviceSlug}`;
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
            queryKey: ["related-treatments", serviceSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("treatments")
                    .select("*")
                    .eq("is_active", true)
                    .neq("slug", serviceSlug)
                    .order("display_order")
                    .limit(6);
                return data || [];
            },
        }),
        queryClient.prefetchQuery({
            queryKey: ["states"],
            queryFn: async () => {
                const { data } = await supabase
                    .from("states")
                    .select("*")
                    .eq("is_active", true)
                    .order("display_order");
                return data || [];
            },
        }),
        queryClient.prefetchQuery({
            queryKey: ['service-price-ranges', serviceSlug],
            queryFn: async () => {
                const { data: ranges } = await supabase
                    .from('service_price_ranges')
                    .select(`
            id, price_min, price_max, state_id,
            state:states(id, name, slug)
          `)
                    .eq('treatment_id', treatment.id);

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
            queryKey: ['profiles', { limit: 50 }],
            queryFn: async () => {
                const { data: clinics } = await supabase
                    .from('clinics')
                    .select(`
            id, name, slug, description, cover_image_url, rating, review_count,
            verification_status, claim_status, city_id, area_id,
            city:cities(name, slug),
            area:areas(name, slug)
          `)
                    .eq('is_active', true)
                    .order('rating', { ascending: false })
                    .limit(50);

                if (!clinics) return [];

                return clinics.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    type: 'clinic',
                    specialty: 'Dental Clinic',
                    location: c.area?.name || c.city?.name || 'UAE',
                    rating: Number(c.rating) || 0,
                    reviewCount: c.review_count || 0,
                    image: c.cover_image_url || null,
                    isVerified: c.claim_status === 'claimed' && c.verification_status === 'verified',
                    clinicName: c.name,
                    clinicId: c.id,
                    areaId: c.area_id,
                    cityId: c.city_id,
                }));
            }
        })
    ]);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600,
    };
};
