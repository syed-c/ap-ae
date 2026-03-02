import { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import StatePageComponent from '@/pages/StatePage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

export default StatePageComponent;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug) {
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

    // 2. Parallelizing independent queries
    await Promise.all([
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
            queryKey: ['seo-page-content', normalizedStateSlug],
            queryFn: async () => {
                const withTrailingSlash = (s: string) => (s.endsWith("/") ? s : `${s}/`);
                const withoutTrailingSlash = (s: string) => s.replace(/\/+$/g, "");

                const candidates = Array.from(new Set([
                    normalizedStateSlug,
                    `/${normalizedStateSlug}`,
                    withTrailingSlash(normalizedStateSlug),
                    withTrailingSlash(`/${normalizedStateSlug}`),
                    withoutTrailingSlash(normalizedStateSlug),
                    `/${withoutTrailingSlash(normalizedStateSlug)}`,
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
        }),
        queryClient.prefetchQuery({
            queryKey: ['pinned-profiles', 'state', normalizedStateSlug, 'undefined'],
            queryFn: async () => {
                const { data } = await supabase
                    .from('pinned_profiles')
                    .select('*')
                    .eq('entity_type', 'state')
                    .eq('entity_slug', normalizedStateSlug)
                    .eq('is_active', true)
                    .order('display_order');
                return data || [];
            }
        })
    ]);

    const pinnedProfiles = queryClient.getQueryData<any>(['pinned-profiles', 'state', normalizedStateSlug, 'undefined']);
    const pinnedIds = pinnedProfiles?.map((p: any) => p.profile_id) || [];

    // 6. Prefetch State Profiles
    await queryClient.prefetchQuery({
        queryKey: ['state-profiles', stateSlug, pinnedIds.join(',')],
        queryFn: async () => {
            const { data: stateCities } = await supabase
                .from('cities')
                .select('id')
                .eq('state_id', stateData.id);

            if (!stateCities?.length) return [];

            const stateCityIds = stateCities.map((c: any) => c.id);

            const { data: clinics } = await supabase
                .from('clinics')
                .select(`
          id, name, slug, description, cover_image_url, rating, review_count,
          address, phone, verification_status, claim_status,
          city:cities(name, slug, state:states(name, abbreviation))
        `)
                .in('city_id', stateCityIds)
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
                location: c.city ? `${c.city.name}, ${c.city.state?.name || c.city.state?.abbreviation || ''}` : '',
                rating: c.rating || 0,
                reviewCount: c.review_count || 0,
                image: c.cover_image_url,
                isVerified: c.verification_status === 'verified',
                isClaimed: c.claim_status === 'claimed',
                isPinned: false,
            }));
        }
    });

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};
