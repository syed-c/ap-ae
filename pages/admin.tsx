import { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import { createServerSupabaseAdmin, getServerUserFromCookieHeader } from '@/lib/supabaseServer';

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
    const user = await getServerUserFromCookieHeader(cookieHeader);
    const supabase = createServerSupabaseAdmin();

    if (!user || !supabase) {
        return {
            redirect: { destination: '/auth', permanent: false },
        };
    }

    try {
        const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

        if (rolesError) {
            throw rolesError;
        }

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
