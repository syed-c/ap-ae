import { GetStaticProps, GetStaticPaths } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';
import ClinicPageComponent from '@/pages/ClinicPage';

export default ClinicPageComponent;

// Generate static paths for all clinic pages at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    const { data: clinics } = await supabase
        .from('clinics')
        .select('slug')
        .eq('is_active', true);
    
    const paths = (clinics || []).map(clinic => ({
        params: { clinicSlug: clinic.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} clinic page paths`);
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Convert to Static Site Generation
export const getStaticProps: GetStaticProps = async (ctx) => {
    return { 
        props: {},
        revalidate: 3600 // Revalidate every hour (ISR)
    };
};
