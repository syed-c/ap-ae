import { GetStaticProps } from 'next';
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

export default function DashboardWithNoIndex() {
    return (
        <>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <AdminDashboard />
        </>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    return { props: {} };
};
