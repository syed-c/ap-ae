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
    
    // Generate ALL combinations (we'll filter at render time)
    const paths: any[] = [];
    
    for (const city of cities) {
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
    
    console.log(`[SSG] Generated ${paths.length} area-service paths (${cities.length} areas × ${treatmentSlugs.length} services)`);
    
    return {
        paths,
        fallback: 'blocking' // Allow new combinations on-demand
    };
};

// Convert to Static Site Generation
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

    // 1. Parallelizing initial independent fetches
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["treatment", serviceSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("treatments")
                    .select("*")
                    .eq("slug", serviceSlug)
                    .maybeSingle();
                return data;
            },
        }),
        (async () => {
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
            if (stateData) {
                await queryClient.prefetchQuery({
                    queryKey: ['city', citySlug, normalizedStateSlug],
                    queryFn: async () => {
                        const { data: cities } = await supabase
                            .from('cities')
                            .select(`*, state:states(*)`)
                            .eq('slug', citySlug)
                            .eq('is_active', true);

                        if (!cities || cities.length === 0) return null;

                        const matchingCity = cities.find(
                            (city: any) => city.state?.slug === normalizedStateSlug
                        );

                        return matchingCity || null;
                    }
                });
            }
        })()
    ]);

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    const cityData = queryClient.getQueryData<any>(['city', citySlug, normalizedStateSlug]);
    const treatmentData = queryClient.getQueryData<any>(['treatment', serviceSlug]);

    if (!stateData || !cityData || !treatmentData) {
        return { notFound: true };
    }

    const seoSlug = `${normalizedStateSlug}/${citySlug}/${serviceSlug}`;

    // 2. Parallelizing remaining fetches
    await Promise.all([
        // 4. Prefetch SEO Content
        queryClient.prefetchQuery({
            queryKey: ['seo-page-content', seoSlug],
            queryFn: async () => {
                const withTrailingSlash = (s: string) => (s.endsWith("/") ? s : `${s}/`);
                const withoutTrailingSlash = (s: string) => s.replace(/\/+$/g, "");

                const candidates = Array.from(new Set([
                    seoSlug,
                    `/${seoSlug}`,
                    withTrailingSlash(seoSlug),
                    withTrailingSlash(`/${seoSlug}`),
                    withoutTrailingSlash(seoSlug),
                    `/${withoutTrailingSlash(seoSlug)}`,
                ].filter(Boolean)));

                // Try optimized
                const { data: optimizedData } = await supabase
                    .from("seo_pages")
                    .select("*")
                    .in("slug", candidates)
                    .eq("is_optimized", true)
                    .not("content", "is", null)
                    .order("updated_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (optimizedData && optimizedData.content) return optimizedData;

                // Try any
                const { data: anyData } = await supabase
                    .from("seo_pages")
                    .select("*")
                    .in("slug", candidates)
                    .not("content", "is", null)
                    .order("updated_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (anyData) return anyData;

                // Try meta only
                const { data: metaOnlyData } = await supabase
                    .from("seo_pages")
                    .select("*")
                    .in("slug", candidates)
                    .or("meta_title.not.is.null,meta_description.not.is.null")
                    .order("is_optimized", { ascending: false })
                    .order("updated_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                return metaOnlyData || null;
            }
        }),

        // 5. Prefetch Related Services
        queryClient.prefetchQuery({
            queryKey: ["related-services", serviceSlug],
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

        // 6. Prefetch nearby cities
        queryClient.prefetchQuery({
            queryKey: ['cities-by-state', normalizedStateSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('cities')
                    .select(`*, state:states(*)`)
                    .eq('state_id', stateData.id)
                    .eq('is_active', true)
                    .order('name');
                return data || [];
            }
        }),

        // 7. Prefetch Service Location Profiles
        queryClient.prefetchQuery({
            queryKey: ['profiles', { cityId: cityData.id, treatmentId: treatmentData.id, limit: 50 }],
            queryFn: async () => {
                let eligibleClinicIds: Set<string> | null = null;

                const { data: cityClinics } = await supabase
                    .from('clinics')
                    .select('id')
                    .eq('city_id', cityData.id)
                    .eq('is_active', true);

                eligibleClinicIds = new Set((cityClinics || []).map((c: any) => c.id));

                if (eligibleClinicIds.size === 0) {
                    return [];
                }

                let treatmentQuery = supabase
                    .from("clinic_treatments")
                    .select("clinic_id, clinic:clinics!inner(id, city_id, is_active)")
                    .eq("treatment_id", treatmentData.id)
                    .eq("clinic.city_id", cityData.id);

                const { data: clinicTreatments } = await treatmentQuery;

                const treatmentClinicIds = new Set((clinicTreatments || [])
                    .filter((ct: any) => ct.clinic?.is_active)
                    .map((ct: any) => ct.clinic_id));

                if (treatmentClinicIds.size > 0) {
                    eligibleClinicIds = new Set([...eligibleClinicIds].filter(id => treatmentClinicIds.has(id)));

                    if (eligibleClinicIds.size === 0) {
                        const { data: fallbackClinics } = await supabase
                            .from('clinics')
                            .select('id')
                            .eq('city_id', cityData.id)
                            .eq('is_active', true);
                        eligibleClinicIds = new Set((fallbackClinics || []).map((c: any) => c.id));
                    }
                }

                const clinicIdArray = [...eligibleClinicIds];
                const profiles: any[] = [];

                let dentistQuery = supabase
                    .from('dentists')
                    .select(`
                *,
                clinic:clinics(
                    id, name, slug, city_id, area_id, verification_status, claim_status, cover_image_url, rating, review_count,
                    city:cities(name, slug),
                    area:areas(name, slug)
                )
                `)
                    .eq('is_active', true)
                    .order('rating', { ascending: false });

                if (clinicIdArray.length > 0) {
                    dentistQuery = dentistQuery.in('clinic_id', clinicIdArray);
                } else {
                    dentistQuery = dentistQuery.eq('id', 'impossible-id-that-never-matches');
                }

                dentistQuery = dentistQuery.limit(50);

                const { data: dentists } = await dentistQuery;

                const clinicsWithDentists = new Set<string>();

                if (dentists) {
                    for (const d of dentists as any[]) {
                        if (d.clinic_id) {
                            clinicsWithDentists.add(d.clinic_id);
                        }

                        if (d.clinic?.city_id !== cityData.id) continue;

                        let photoUrl = d.image_url;
                        if (!photoUrl && d.clinic?.cover_image_url) {
                            photoUrl = d.clinic.cover_image_url;
                        }

                        const isVerified = d.clinic?.claim_status === 'claimed' && d.clinic?.verification_status === 'verified';

                        profiles.push({
                            id: d.id,
                            name: d.name,
                            slug: d.slug,
                            type: 'dentist',
                            specialty: d.title || 'General Dentist',
                            location: d.clinic?.area?.name || d.clinic?.city?.name || 'UAE',
                            rating: Number(d.rating) || 0,
                            reviewCount: d.review_count || 0,
                            image: photoUrl || null,
                            isVerified,
                            clinicName: d.clinic?.name,
                            clinicId: d.clinic_id || null,
                            languages: d.languages || [],
                            areaId: d.clinic?.area_id,
                            cityId: d.clinic?.city_id,
                        });
                    }
                }

                let clinicQuery = supabase
                    .from('clinics')
                    .select(`
                *,
                city:cities(name, slug),
                area:areas(name, slug)
                `)
                    .eq('is_active', true)
                    .order('rating', { ascending: false });

                if (clinicIdArray.length > 0) {
                    clinicQuery = clinicQuery.in('id', clinicIdArray);
                } else {
                    clinicQuery = clinicQuery.eq('city_id', cityData.id);
                }

                const { data: clinics } = await clinicQuery as any;

                if (clinics) {
                    for (const c of clinics) {
                        if (clinicsWithDentists.has(c.id)) continue;

                        let photoUrl = c.cover_image_url;

                        const isVerified = c.claim_status === 'claimed' && c.verification_status === 'verified';

                        profiles.push({
                            id: c.id,
                            name: c.name,
                            slug: c.slug,
                            type: 'clinic',
                            specialty: 'Dental Clinic',
                            location: c.area?.name || c.city?.name || 'UAE',
                            rating: Number(c.rating) || 0,
                            reviewCount: c.review_count || 0,
                            image: photoUrl || null,
                            isVerified,
                            clinicName: c.name,
                            clinicId: c.id,
                            areaId: c.area_id,
                            cityId: c.city_id,
                        });
                    }
                }

                profiles.sort((a, b) => b.rating - a.rating);

                if (profiles.length > 50) {
                    return profiles.slice(0, 50);
                }

                return profiles;
            }
        })
    ]);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600, // Revalidate every hour (ISR)
    };
};
