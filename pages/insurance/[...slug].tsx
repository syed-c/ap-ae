import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import InsuranceDetailPageComponent from '@/pages/InsuranceDetailPage';

const BASE_URL = 'https://www.appointpanda.ae';

const InsuranceDetailWrapper = ({ 
    insuranceSlug, 
    insuranceData, 
    emirateData, 
    cityData,
    clinicCount,
    seoData, 
    dehydratedState 
}: {
    insuranceSlug: string;
    insuranceData: any;
    emirateData?: any;
    cityData?: any;
    clinicCount: number;
    seoData: { title: string; description: string; canonical: string };
    dehydratedState: any;
}) => {
    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
            </Head>
            <InsuranceDetailPageComponent 
                insuranceSlugProp={insuranceSlug}
                insuranceDataProp={insuranceData}
                emirateDataProp={emirateData}
                cityDataProp={cityData}
                clinicCountProp={clinicCount}
                seoDataProp={seoData}
                dehydratedStateProp={dehydratedState}
            />
        </>
    );
};

export default InsuranceDetailWrapper;

// Generate static paths for insurance pages
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();

    const { data: insurances } = await supabase
        .from('insurances')
        .select('slug')
        .eq('is_active', true);

    const { data: states } = await supabase
        .from('states')
        .select('slug')
        .eq('is_active', true);

    const paths: { params: { slug: string[] } }[] = [];

    for (const ins of insurances || []) {
        // Shape 1: /insurance/[provider]/
        paths.push({ params: { slug: [ins.slug] } });

        // Shape 2: /insurance/[provider]/[emirate]/
        for (const state of states || []) {
            paths.push({ params: { slug: [ins.slug, state.slug] } });
        }
    }

    // Shape 3: /insurance/[provider]/[emirate]/[city]/ — skip at build time
    // Too many combinations. Let ISR handle city-level pages on demand.

    return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    
    const slugSegments = (ctx.params?.slug as string[]) || [];
    const insuranceSlug = slugSegments[0] || '';
    const emirateSlug = slugSegments[1] || '';
    const citySlug = slugSegments[2] || '';

    if (!insuranceSlug) {
        return { notFound: true };
    }

    // Prefetch insurance data
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["insurance", insuranceSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("insurances")
                    .select("*")
                    .eq("slug", insuranceSlug)
                    .eq("is_active", true)
                    .maybeSingle();
                return data;
            },
        }),
        queryClient.prefetchQuery({
            queryKey: ["seo-page-content", `insurance/${insuranceSlug}`],
            queryFn: async () => {
                const { data } = await supabase
                    .from("seo_pages")
                    .select("id, slug, meta_title, meta_description, content, is_optimized")
                    .or(`slug.eq.insurance/${insuranceSlug},slug.eq./insurance/${insuranceSlug}`)
                    .order("is_optimized", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                return data || null;
            },
        }),
    ]);

    const insuranceData = queryClient.getQueryData<any>(["insurance", insuranceSlug]);

    if (!insuranceData) {
        return { notFound: true };
    }

    let emirateData = null;
    let cityData = null;
    let clinicCount = 0;

    // Only fetch emirate/city data if we have those segments
    if (emirateSlug) {
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: ["state", emirateSlug],
                queryFn: async () => {
                    const { data } = await supabase
                        .from("states")
                        .select("*")
                        .eq("slug", emirateSlug)
                        .eq("is_active", true)
                        .maybeSingle();
                    return data;
                },
            }),
            queryClient.prefetchQuery({
                queryKey: ["insurance-clinics-count", insuranceSlug, emirateSlug],
                queryFn: async () => {
                    // Get state ID first
                    const { data: state } = await supabase
                        .from("states")
                        .select("id")
                        .eq("slug", emirateSlug)
                        .maybeSingle();
                    
                    if (!state) return 0;

                    // Get clinics in this state that accept this insurance
                    const { count } = await supabase
                        .from("clinic_insurances")
                        .select("clinic_id, clinics!inner(id, is_active, cities!inner(state_id))", { count: "exact", head: true })
                        .eq("insurance_id", insuranceData.id)
                        .eq("clinics.is_active", true)
                        .eq("clinics.cities.state_id", state.id);

                    return count || 0;
                },
            }),
        ]);

        emirateData = queryClient.getQueryData<any>(["state", emirateSlug]);
        clinicCount = queryClient.getQueryData<number>(["insurance-clinics-count", insuranceSlug, emirateSlug]) || 0;

        // Return notFound for emirate with no clinics
        if (clinicCount === 0) {
            return { notFound: true };
        }

        // If city slug is provided, fetch city data
        if (citySlug) {
            await Promise.all([
                queryClient.prefetchQuery({
                    queryKey: ["city", citySlug, emirateSlug],
                    queryFn: async () => {
                        const { data } = await supabase
                            .from("cities")
                            .select("*, state:states(*)")
                            .eq("slug", citySlug)
                            .eq("is_active", true)
                            .maybeSingle();
                        return data;
                    },
                }),
                queryClient.prefetchQuery({
                    queryKey: ["insurance-clinics-count-city", insuranceSlug, emirateSlug, citySlug],
                    queryFn: async () => {
                        // Get city ID first
                        const { data: city } = await supabase
                            .from("cities")
                            .select("id")
                            .eq("slug", citySlug)
                            .eq("is_active", true)
                            .maybeSingle();
                        
                        if (!city) return 0;

                        const { count } = await supabase
                            .from("clinic_insurances")
                            .select("clinic_id, clinics!inner(id, is_active)", { count: "exact", head: true })
                            .eq("insurance_id", insuranceData.id)
                            .eq("clinics.is_active", true)
                            .eq("clinics.city_id", city.id);

                        return count || 0;
                    },
                }),
            ]);

            cityData = queryClient.getQueryData<any>(["city", citySlug, emirateSlug]);
            clinicCount = queryClient.getQueryData<number>(["insurance-clinics-count-city", insuranceSlug, emirateSlug, citySlug]) || 0;

            // Return notFound for city with no clinics
            if (clinicCount === 0) {
                return { notFound: true };
            }
        }
    } else {
        // No emirate - get total clinic count for this insurance
        const { count } = await supabase
            .from("clinic_insurances")
            .select("clinic_id, clinics!inner(id, is_active)", { count: "exact", head: true })
            .eq("insurance_id", insuranceData.id)
            .eq("clinics.is_active", true);
        clinicCount = count || 0;
    }

    const seoContent = queryClient.getQueryData<any>(["seo-page-content", `insurance/${insuranceSlug}`]);

    // Build canonical URL
    let canonical = `/insurance/${insuranceSlug}/`;
    if (emirateSlug) {
        canonical = `/insurance/${insuranceSlug}/${emirateSlug}/`;
        if (citySlug) {
            canonical = `/insurance/${insuranceSlug}/${emirateSlug}/${citySlug}/`;
        }
    }

    // Build title and description
    const insuranceName = insuranceData.name;
    let metaTitle: string;
    let metaDescription: string;

    if (seoContent?.meta_title) {
        metaTitle = seoContent.meta_title;
    } else if (emirateSlug && citySlug) {
        metaTitle = `${insuranceName} Accepted Clinics in ${cityData?.name || citySlug}, ${emirateData?.name || emirateSlug} | Book Now`;
    } else if (emirateSlug) {
        metaTitle = `${insuranceName} Accepted Clinics in ${emirateData?.name || emirateSlug} | Compare & Book`;
    } else {
        metaTitle = `${insuranceName} Dental Insurance UAE | Find Accepted Clinics`;
    }

    if (seoContent?.meta_description) {
        metaDescription = seoContent.meta_description;
    } else if (emirateSlug) {
        metaDescription = `Find ${clinicCount} dental clinics accepting ${insuranceName} in ${emirateData?.name || emirateSlug}. Compare ratings, book appointments online.`;
    } else {
        metaDescription = `Find ${clinicCount} dental clinics accepting ${insuranceName} across UAE. Compare ratings, verified dentists, easy online booking.`;
    }

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            insuranceSlug,
            insuranceData,
            emirateData,
            cityData,
            clinicCount,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical,
            },
        },
        revalidate: 3600,
    };
};