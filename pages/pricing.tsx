import { GetStaticProps } from 'next';
import PricingPage from '@/pages/PricingPage';
export default PricingPage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
