import { GetStaticProps, GetStaticPaths } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';
import DentistPageComponent from '@/pages/DentistPage';

export default DentistPageComponent;

// Generate static paths for all dentist pages at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    console.log('[SSG] Generating dentist paths...');
    
    const { data: dentists } = await supabase
        .from('dentists')
        .select('slug')
        .eq('is_active', true);
    
    const paths = (dentists || []).map(dentist => ({
        params: { dentistSlug: dentist.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} dentist paths`);
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Convert to Static Site Generation
export const getStaticProps: GetStaticProps = async () => {
    return { 
        props: {},
        revalidate: 3600 // Revalidate every hour (ISR)
    };
};
