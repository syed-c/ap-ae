import { GetServerSideProps } from 'next';
import { createServerSupabaseAdmin, getServerUserFromCookieHeader } from '@/lib/supabaseServer';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/pages/admin/AdminDashboard'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        </div>
    )
});

const DentistDashboard = dynamic(() => import('@/components/dashboard-v2/DentistDashboardV2'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        </div>
    )
});

const PatientDashboard = dynamic(() => import('@/components/patient/PatientDashboard'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        </div>
    )
});

interface DashboardProps {
    dashboardType: 'admin' | 'clinic' | 'patient' | 'none';
}

function DashboardPage({ dashboardType }: DashboardProps) {
    return (
        <>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            {dashboardType === 'admin' && <AdminDashboard />}
            {dashboardType === 'clinic' && <DentistDashboard />}
            {dashboardType === 'patient' && <PatientDashboard />}
            {dashboardType === 'none' && (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <p className="text-muted-foreground">No dashboard available for your role.</p>
                </div>
            )}
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const supabase = createServerSupabaseAdmin();
    const { req } = ctx;
    const cookieHeader = req.headers.cookie || '';
    const user = await getServerUserFromCookieHeader(cookieHeader);

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

        const userRoles = (roles || []).map(r => r.role);

        const isSuperAdmin = userRoles.includes('super_admin');
        const isPlatformAdmin = userRoles.includes('platform_admin');
        const isContentMod = userRoles.includes('content_moderator');
        const isClinicStaff = userRoles.includes('clinic_owner') || userRoles.includes('clinic_manager') || userRoles.includes('receptionist');
        const isDentist = userRoles.includes('dentist');
        const isPatient = userRoles.includes('patient');

        if (isSuperAdmin || isPlatformAdmin || isContentMod) {
            return { props: { dashboardType: 'admin' } };
        }
        if (isDentist || isClinicStaff) {
            return { props: { dashboardType: 'clinic' } };
        }
        if (isPatient) {
            return { props: { dashboardType: 'patient' } };
        }

        return { props: { dashboardType: 'none' } };
    } catch {
        return {
            redirect: { destination: '/auth', permanent: false },
        };
    }
};

export default DashboardPage;
