import { GetStaticProps } from 'next';
import DentistDashboardV2 from '@/components/dashboard-v2/DentistDashboardV2';
export default DentistDashboardV2;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
