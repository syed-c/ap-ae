import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import InsuranceDetailPageComponent from '@/pages/InsuranceDetailPage';

const BASE_URL = 'https://www.appointpanda.ae';

const PAGE_SIZE = 20;

const InsuranceDetailWrapper = ({ 
    insuranceSlug, 
    emirateSlug,
    citySlug,
    insuranceData, 
    emirateData, 
    cityData,
    clinicCount,
    seoData,
    initialClinics,
    availableEmirates,
    filterCities,
    insuranceLinks,
    serviceLinks,
}: {
    insuranceSlug: string;
    emirateSlug: string | null;
    citySlug: string | null;
    insuranceData: any;
    emirateData?: any;
    cityData?: any;
    clinicCount: number;
    seoData: { title: string; description: string; canonical: string };
    initialClinics?: any[];
    availableEmirates?: { name: string; slug: string }[];
    filterCities?: any[];
    insuranceLinks?: { name: string; slug: string }[];
    serviceLinks?: { name: string; slug: string }[];
}) => {
    const insuranceName = insuranceData?.name || insuranceSlug;
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Insurance", item: `${BASE_URL}/insurance/` },
            { "@type": "ListItem", position: 3, name: insuranceName, item: `${BASE_URL}${seoData.canonical}` },
        ]
    };
    const insuranceSchema = {
        "@context": "https://schema.org",
        "@type": "InsuranceProduct",
        "name": insuranceName,
        "description": seoData.description,
        "url": `${BASE_URL}${seoData.canonical}`,
        "areaServed": "United Arab Emirates",
    };

    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
                <link rel="canonical" href={`${BASE_URL}${seoData.canonical}`} />
                <meta name="robots" content="index, follow" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
                <meta property="og:description" content={seoData.description} />
                <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
                <meta property="og:site_name" content="AppointPanda" />
                <meta property="og:locale" content="en_AE" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta name="twitter:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
                <meta name="twitter:description" content={seoData.description} />
                <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
                <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}${seoData.canonical}`} />
                <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${seoData.canonical}`} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(insuranceSchema) }}
                />
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
                initialClinicsProp={initialClinics}
                availableEmiratesProp={availableEmirates}
                filterCitiesProp={filterCities}
                insuranceLinksProp={insuranceLinks}
                serviceLinksProp={serviceLinks}
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

    if (!supabase) {
        return {
            props: {
                insuranceSlug,
                emirateSlug,
                citySlug,
                seoData: {
                    title: 'Dental Insurance',
                    description: 'Find dentists that accept your insurance in UAE',
                    canonical: `/insurance/${insuranceSlug}/`,
                },
                initialClinics: [],
                availableEmirates: [],
                filterCities: [],
            },
            revalidate: 60,
        };
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
    let initialClinics: any[] = [];
    let availableEmirates: { name: string; slug: string }[] = [];
    let filterCities: any[] = [];
    let insuranceLinks: { name: string; slug: string }[] = [];
    let serviceLinks: { name: string; slug: string }[] = [];

    const availableEmiratesResult = await supabase
        .from('states')
        .select('name, slug')
        .eq('is_active', true)
        .order('display_order');
    availableEmirates = availableEmiratesResult.data || [];

    const [insuranceLinksResult, serviceLinksResult] = await Promise.all([
        supabase
            .from('insurances')
            .select('name, slug')
            .eq('is_active', true)
            .order('display_order')
            .limit(12),
        supabase
            .from('treatments')
            .select('name, slug')
            .eq('is_active', true)
            .order('display_order')
            .limit(12),
    ]);

    insuranceLinks = insuranceLinksResult.data || [];
    serviceLinks = serviceLinksResult.data || [];

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
                        .select("clinic_id, clinics!inner(id, is_active, is_likely_dental)", { count: "exact", head: true })
                        .eq("insurance_id", insuranceData.id)
                        .eq("clinics.is_active", true)
                        .eq("clinics.is_likely_dental", true)
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
            .select("clinic_id, clinics!inner(id, is_active, is_likely_dental)", { count: "exact", head: true })
            .eq("insurance_id", insuranceData.id)
            .eq("clinics.is_active", true)
            .eq("clinics.is_likely_dental", true);
        clinicCount = count || 0;
    }

    let eligibleClinicIds: string[] | null = null;

    if (cityData?.id) {
        const cityClinics = await supabase
            .from('clinics')
            .select('id')
            .eq('city_id', cityData.id)
            .eq('is_active', true)
            .eq('is_likely_dental', true)
            .order('rating', { ascending: false })
            .limit(200);
        eligibleClinicIds = (cityClinics.data || []).map((clinic) => clinic.id);
    } else if (emirateData?.id) {
        const emirateCities = await supabase
            .from('cities')
            .select('id')
            .eq('state_id', emirateData.id)
            .eq('is_active', true);
        const emirateCityIds = (emirateCities.data || []).map((city) => city.id);

        if (emirateCityIds.length > 0) {
            const emirateClinics = await supabase
                .from('clinics')
                .select('id')
                .in('city_id', emirateCityIds)
                .eq('is_active', true)
                .eq('is_likely_dental', true)
                .order('rating', { ascending: false })
                .limit(400);
            eligibleClinicIds = (emirateClinics.data || []).map((clinic) => clinic.id);
        } else {
            eligibleClinicIds = [];
        }
    }

    let clinicsQuery = supabase
        .from('clinic_insurances')
        .select(`
            clinic_id,
            clinics!inner(
                id, name, slug, rating, review_count, cover_image_url, verification_status, is_active,
                city_id,
                cities(id, name, slug, state:states(slug, abbreviation))
            )
        `)
        .eq('insurance_id', insuranceData.id)
        .eq('clinics.is_active', true)
        .eq('clinics.is_likely_dental', true)
        .order('clinics(rating)', { ascending: false, nullsFirst: false });

    if (eligibleClinicIds) {
        if (eligibleClinicIds.length === 0) {
            clinicsQuery = clinicsQuery.in('clinic_id', ['00000000-0000-0000-0000-000000000000']);
        } else {
            clinicsQuery = clinicsQuery.in('clinic_id', eligibleClinicIds);
        }
    }

    const clinicsQueryResult = await clinicsQuery.range(0, PAGE_SIZE - 1);

    initialClinics = (clinicsQueryResult.data || [])
        .map((row: any) => {
            const clinic = row.clinics;
            if (!clinic) return null;

            const city = Array.isArray(clinic.cities) ? clinic.cities[0] : clinic.cities;
            const state = Array.isArray(city?.state) ? city.state[0] : city?.state;

            return {
                id: clinic.id,
                name: clinic.name,
                slug: clinic.slug,
                rating: clinic.rating,
                review_count: clinic.review_count,
                cover_image_url: clinic.cover_image_url,
                verification_status: clinic.verification_status,
                city: city ? {
                    id: city.id,
                    name: city.name,
                    slug: city.slug,
                    state: state || null,
                } : null,
                area: null,
            };
        })
        .filter(Boolean);

    const filterCitiesResult = await supabase
        .from('clinic_insurances')
        .select(`
            clinics!inner(
                id, is_active, city_id,
                cities(id, name, slug, state:states(slug, abbreviation, name))
            )
        `)
        .eq('insurance_id', insuranceData.id)
        .eq('clinics.is_active', true)
        .limit(1000);

    if (filterCitiesResult.data?.length) {
        const cityMap = new Map();
        for (const row of filterCitiesResult.data as any[]) {
            const clinic = row.clinics;
            const city = Array.isArray(clinic?.cities) ? clinic.cities[0] : clinic?.cities;
            const state = Array.isArray(city?.state) ? city.state[0] : city?.state;
            if (!city?.id || cityMap.has(city.id)) continue;
            cityMap.set(city.id, {
                id: city.id,
                name: city.name,
                slug: city.slug,
                stateSlug: state?.slug || '',
                stateAbbreviation: state?.abbreviation || '',
                stateName: state?.name || '',
            });
        }
        filterCities = Array.from(cityMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
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
            initialClinics,
            availableEmirates,
            filterCities,
            insuranceLinks,
            serviceLinks,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical,
            },
        },
        revalidate: 600,
    };
};
