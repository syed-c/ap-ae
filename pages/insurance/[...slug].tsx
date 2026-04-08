import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import InsuranceDetailPageComponent from '@/pages/InsuranceDetailPage';

const BASE_URL = 'https://www.appointpanda.ae';

const InsuranceDetailWrapper = ({ 
    insuranceSlug, 
    emirateSlug,
    citySlug,
    insuranceData, 
    emirateData, 
    cityData,
    clinicCount,
    seoData
}: {
    insuranceSlug: string;
    emirateSlug: string | null;
    citySlug: string | null;
    insuranceData: any;
    emirateData?: any;
    cityData?: any;
    clinicCount: number;
    seoData: { title: string; description: string; canonical: string };
}) => {
    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
                <link rel="canonical" href={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
                <meta property="og:description" content={seoData.description} />
                <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
                <meta property="og:site_name" content="AppointPanda" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta name="twitter:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
                <meta name="twitter:description" content={seoData.description} />
                <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
            </Head>
            <InsuranceDetailPageComponent 
                insuranceSlugProp={insuranceSlug}
                emirateSlugProp={emirateSlug || undefined}
                citySlugProp={citySlug || undefined}
                insuranceDataProp={insuranceData}
                emirateDataProp={emirateData}
                cityDataProp={cityData}
                clinicCountProp={clinicCount}
                seoDataProp={seoData}
            />
        </>
    );
};

export default InsuranceDetailWrapper;

// Generate static paths - limit to insurance-only routes for build speed
// State/city combinations will be ISR (fallback: 'blocking')
export const getStaticPaths: GetStaticPaths = async () => {
    try {
const supabase = createServerSupabaseAdmin();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        // Only pre-build insurance index pages - state/city combos will be ISR
        const { data: insurances } = await supabase
            .from('insurances')
            .select('slug');
        
        const paths: { params: { slug: string[] } }[] = [];
        
        for (const insurance of insurances || []) {
            paths.push({ params: { slug: [insurance.slug] } });
        }
        
        return { paths, fallback: 'blocking' };
    } catch (error) {
        console.error('Error generating insurance paths:', error);
        return { paths: [], fallback: 'blocking' };
    }
};

export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabaseAdmin();
    
    const slugSegments = (ctx.params?.slug as string[]) || [];
    const insuranceSlug = slugSegments[0] || '';
    const emirateSlug = slugSegments[1] || '';
    const citySlug = slugSegments[2] || '';

    if (!insuranceSlug) {
        return { notFound: true };
    }

    // Direct queries instead of React Query for faster build
    const [insuranceData, seoContent] = await Promise.all([
        supabase
            .from("insurances")
            .select("*")
            .eq("slug", insuranceSlug)
            .eq("is_active", true)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from("seo_pages")
            .select("id, slug, meta_title, meta_description, content, is_optimized")
            .or(`slug.eq.insurance/${insuranceSlug},slug.eq./insurance/${insuranceSlug}`)
            .order("is_optimized", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => r.data)
    ]);

    if (!insuranceData) {
        return { notFound: true };
    }

    let emirateData = null;
    let cityData = null;
    let clinicCount = 0;

    if (emirateSlug) {
        const [stateData, countData] = await Promise.all([
            supabase
                .from("states")
                .select("*")
                .eq("slug", emirateSlug)
                .eq("is_active", true)
                .maybeSingle()
                .then(r => r.data),
            (async () => {
                const state = await supabase.from("states").select("id").eq("slug", emirateSlug).maybeSingle().then(r => r.data);
                if (!state) return 0;
                const { count } = await supabase
                    .from("clinic_insurances")
                    .select("clinic_id, clinics!inner(id, is_active, cities!inner(state_id))", { count: "exact", head: true })
                    .eq("insurance_id", insuranceData.id)
                    .eq("clinics.is_active", true)
                    .eq("clinics.cities.state_id", state.id);
                return count || 0;
            })()
        ]);

        emirateData = stateData;
        clinicCount = countData;

        if (citySlug) {
            const [cityResult, cityCount] = await Promise.all([
                supabase
                    .from("cities")
                    .select("*, state:states(*)")
                    .eq("slug", citySlug)
                    .eq("is_active", true)
                    .maybeSingle()
                    .then(r => r.data),
                (async () => {
                    const city = await supabase.from("cities").select("id").eq("slug", citySlug).eq("is_active", true).maybeSingle().then(r => r.data);
                    if (!city) return 0;
                    const { count } = await supabase
                        .from("clinic_insurances")
                        .select("clinic_id, clinics!inner(id, is_active)", { count: "exact", head: true })
                        .eq("insurance_id", insuranceData.id)
                        .eq("clinics.is_active", true)
                        .eq("clinics.city_id", city.id);
                    return count || 0;
                })()
            ]);

            cityData = cityResult;
            clinicCount = cityCount;
        }
    } else {
        const { count } = await supabase
            .from("clinic_insurances")
            .select("clinic_id, clinics!inner(id, is_active)", { count: "exact", head: true })
            .eq("insurance_id", insuranceData.id)
            .eq("clinics.is_active", true);
        clinicCount = count || 0;
    }

    let canonical = `/insurance/${insuranceSlug}/`;
    if (emirateSlug) {
        canonical = `/insurance/${insuranceSlug}/${emirateSlug}/`;
        if (citySlug) {
            canonical = `/insurance/${insuranceSlug}/${emirateSlug}/${citySlug}/`;
        }
    }

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
            insuranceSlug,
            emirateSlug: emirateSlug || null,
            citySlug: citySlug || null,
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
        revalidate: 600,
    };
};