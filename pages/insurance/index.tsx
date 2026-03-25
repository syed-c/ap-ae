import Head from 'next/head';
import InsurancePageComponent from '@/pages/InsurancePage';

const BASE_URL = 'https://www.appointpanda.ae';

export default function InsuranceIndexPage() {
    return (
        <>
            <Head>
                <title>Dental Insurance Providers in UAE | Compare Plans</title>
                <meta name="description" content="Find and compare dental insurance providers accepted by clinics across UAE. Browse by provider to find coverage for your dental needs." />
                <link rel="canonical" href={`${BASE_URL}/insurance/`} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${BASE_URL}/insurance/`} />
                <meta property="og:title" content="Dental Insurance Providers in UAE | Compare Plans" />
                <meta property="og:description" content="Find and compare dental insurance providers accepted by clinics across UAE." />
                <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
                <meta property="og:site_name" content="AppointPanda" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}/insurance/`} />
                <meta name="twitter:title" content="Dental Insurance Providers in UAE | Compare Plans" />
                <meta name="twitter:description" content="Find and compare dental insurance providers accepted by clinics across UAE." />
                <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
            </Head>
            <InsurancePageComponent 
                insuranceListProp={[]}
                clinicCountsProp={{}}
                seoDataProp={{
                    title: 'Dental Insurance Providers in UAE | Compare Plans',
                    description: 'Find and compare dental insurance providers accepted by clinics across UAE.'
                }}
            />
        </>
    );
}