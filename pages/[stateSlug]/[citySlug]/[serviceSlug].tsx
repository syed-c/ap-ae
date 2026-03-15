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

// Convert to Static Site Generation - FULL DATA PREFETCH FOR SEO
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

    // Fetch state and treatment in parallel
    await Promise.all([
        queryClient.prefetchQuery({
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
        }),
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
    ]);

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    const treatmentData = queryClient.getQueryData<any>(['treatment', serviceSlug]);

    if (!stateData || !treatmentData) {
        return { notFound: true };
    }

    // Fetch city
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

    const cityData = queryClient.getQueryData<any>(['city', citySlug, normalizedStateSlug]);
    if (!cityData) {
        return { notFound: true };
    }

    const seoSlug = `${normalizedStateSlug}/${citySlug}/${serviceSlug}`;

    // Fetch SEO content, related services, nearby cities IN PARALLEL
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

    // Fetch profiles for this city + treatment
    await queryClient.prefetchQuery({
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
    });

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600,
    };
};
};
