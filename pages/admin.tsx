import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { createServerSupabase } from '@/lib/supabaseServer';

const AdminDashboard = dynamic(() => import('@/pages/admin/AdminDashboard'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        </div>
    )
});

export default AdminDashboard;

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const cookieHeader = req.headers.cookie || '';
    const hasAuthCookie = cookieHeader.includes('sb-eneuthbghipsdvsqilmb-auth-token') || cookieHeader.includes('sb-');
    const supabase = createServerSupabase();

    if (!hasAuthCookie || !supabase) {
        return {
            redirect: { destination: '/auth', permanent: false },
        };
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                redirect: { destination: '/auth', permanent: false },
            };
        }

        const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

        const userRoles = (roles || []).map((role) => role.role);
        const isAdmin = userRoles.includes('super_admin') || userRoles.includes('platform_admin') || userRoles.includes('content_moderator');
        const isDentist = userRoles.includes('dentist') || userRoles.includes('clinic_owner') || userRoles.includes('clinic_manager') || userRoles.includes('receptionist');

        if (!isAdmin) {
            return {
                redirect: {
                    destination: isDentist ? '/dashboard' : '/',
                    permanent: false,
                },
            };
        }

        return { props: {} };
    } catch {
        return {
            redirect: { destination: '/auth', permanent: false },
        };
    }
};
