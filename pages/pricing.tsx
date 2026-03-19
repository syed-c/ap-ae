import { GetStaticProps } from 'next';
import PricingPage from '@/pages/PricingPage';
export default PricingPage;

// ISR: Revalidate pricing page every hour for fresh plan info
export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 3600 });
