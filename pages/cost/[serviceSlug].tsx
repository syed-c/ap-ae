import { GetStaticProps } from 'next';
import ServicePricePage from '@/pages/ServicePricePage';
export default ServicePricePage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
