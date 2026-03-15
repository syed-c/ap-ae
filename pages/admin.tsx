import { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/pages/admin/AdminDashboard'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
        </div>
    )
});

export default AdminDashboard;

export const getServerSideProps: GetStaticProps = async () => {
    return { props: {} };
};
