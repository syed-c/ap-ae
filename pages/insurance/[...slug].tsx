import { GetStaticProps } from 'next';
import InsuranceDetailPage from '@/pages/InsuranceDetailPage';
export default InsuranceDetailPage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
