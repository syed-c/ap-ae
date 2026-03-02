import { GetServerSideProps } from 'next';
import AdminDashboard from '@/pages/admin/AdminDashboard';

export default AdminDashboard;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
