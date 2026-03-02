import { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import CityPageComponent from '@/pages/CityPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

export default CityPageComponent;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const citySlug = ctx.params?.citySlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug || !citySlug) {
        return { notFound: true };
    }

    // 1. Prefetch State
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

    // 2. Prefetch City
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

    const cityData = queryClient.getQueryData<any>(['city', citySlug, normalizedStateSlug]);

    // If no city is found, we might still want to render the page if it matches a treatment,
    // but for SSR data fetching we'll just skip the city-dependent queries.
    // The client side logic in `CityPage.tsx` handles the fallback to `StateServicePage`.

    const seoSlug = `${normalizedStateSlug}/${citySlug}`;
    const prefetchSEOAndTreatments = () => Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['seo-page-content', seoSlug],
            queryFn: async () => {
                const parts = seoSlug.split("/").filter(Boolean);
                const statePart = parts[0] ? normalizeStateSlug(parts[0]) : "";
                const cityPart = parts[1] || "";
                const cityWithStateSuffix = statePart && cityPart && !cityPart.endsWith(`-${statePart}`)
                    ? `${cityPart}-${statePart}`
                    : cityPart;

                const cityStatefulSlug = parts.length >= 2
                    ? [statePart, cityWithStateSuffix, ...parts.slice(2)].filter(Boolean).join("/")
                    : null;

                const withTrailingSlash = (s: string) => (s.endsWith("/") ? s : `${s}/`);
                const withoutTrailingSlash = (s: string) => s.replace(/\/+$/g, "");

                const candidates = Array.from(new Set([
                    seoSlug,
                    `/${seoSlug}`,
                    ...(cityStatefulSlug ? [cityStatefulSlug, `/${cityStatefulSlug}`] : []),
                    withTrailingSlash(seoSlug),
                    withTrailingSlash(`/${seoSlug}`),
                    ...(cityStatefulSlug ? [withTrailingSlash(cityStatefulSlug), withTrailingSlash(`/${cityStatefulSlug}`)] : []),
                    withoutTrailingSlash(seoSlug),
                    `/${withoutTrailingSlash(seoSlug)}`,
                    ...(cityStatefulSlug ? [withoutTrailingSlash(cityStatefulSlug), `/${withoutTrailingSlash(cityStatefulSlug)}`] : []),
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
        queryClient.prefetchQuery({
            queryKey: ["treatments"],
            queryFn: async () => {
                const { data } = await supabase
                    .from("treatments")
                    .select("*")
                    .eq("is_active", true)
                    .order("display_order")
                    .limit(8);
                return data || [];
            },
        })
    ]);

    if (cityData) {
        // Parallelize independent queries
        await Promise.all([
            prefetchSEOAndTreatments(),
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

        // 6. Prefetch City Profiles
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
    } else {
        // 7. Check treatment match if city not found
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

        if (treatmentMatch) {
            // This is a StateServicePage case
            await Promise.all([
                prefetchSEOAndTreatments(),
                queryClient.prefetchQuery({
                    queryKey: ['cities-by-state', normalizedStateSlug],
                    queryFn: async () => {
                        const { data } = await supabase
                            .from('cities')
                            .select(`*`)
                            .eq('state_id', stateData.id)
                            .eq('is_active', true)
                            .order('name');
                        return data || [];
                    }
                }),
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
        } else {
            await prefetchSEOAndTreatments();
        }
    }

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};
