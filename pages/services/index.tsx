import { GetStaticProps } from 'next';
import ServicesPageComponent from '@/pages/ServicesPage';

export default ServicesPageComponent;

export const getStaticProps: GetStaticProps = async () => {
    return { props: {} };
};
