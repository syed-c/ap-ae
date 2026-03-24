import { GetStaticProps } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import InsurancePageComponent from '@/pages/InsurancePage';

const BASE_URL = 'https://www.appointpanda.ae';

const InsuranceIndexWrapper = ({ insuranceList, seoData, clinicCounts, dehydratedState }: {
    insuranceList: any[];
    seoData: { title: string; description: string; canonical: string };
    clinicCounts: Record<string, number>;
    dehydratedState: any;
}) => {
    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
                <link rel="canonical" href={seoData.canonical} />
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
            <InsurancePageComponent 
                insuranceListProp={insuranceList}
                clinicCountsProp={clinicCounts}
                seoDataProp={seoData}
                dehydratedStateProp={dehydratedState}
            />
        </>
    );
};

export default InsuranceIndexWrapper;

export const getStaticProps: GetStaticProps = async () => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();

    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["insurances-full"],
            queryFn: async () => {
                const { data } = await supabase
                    .from("insurances")
                    .select("*")
                    .eq("is_active", true)
                    .order("name");
                return data || [];
            },
        }),
        queryClient.prefetchQuery({
            queryKey: ["insurance-clinic-counts"],
            queryFn: async () => {
                const { data } = await supabase
                    .from("clinic_insurances")
                    .select("insurance_id");
                const counts: Record<string, number> = {};
                (data || []).forEach((row: any) => {
                    counts[row.insurance_id] = (counts[row.insurance_id] || 0) + 1;
                });
                return counts;
            },
        }),
        queryClient.prefetchQuery({
            queryKey: ["seo-page-content", "insurance"],
            queryFn: async () => {
                const { data } = await supabase
                    .from("seo_pages")
                    .select("id, slug, meta_title, meta_description, content, is_optimized")
                    .or("slug.eq.insurance,slug.eq./insurance")
                    .order("is_optimized", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                return data || null;
            },
        }),
    ]);

    const insuranceList = queryClient.getQueryData<any[]>(["insurances-full"]) || [];
    const clinicCounts = queryClient.getQueryData<Record<string, number>>(["insurance-clinic-counts"]) || {};
    const seoContent = queryClient.getQueryData<any>(["seo-page-content", "insurance"]);

    const metaTitle = seoContent?.meta_title || "Dental Insurance Providers in UAE | Compare Plans";
    const metaDescription = seoContent?.meta_description || "Find and compare dental insurance providers accepted by clinics across UAE. Browse by provider to find coverage for your dental needs.";

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            insuranceList,
            clinicCounts,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: '/insurance/',
            },
        },
        revalidate: 3600,
    };
};