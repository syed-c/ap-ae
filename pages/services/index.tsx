import { GetStaticProps } from 'next';
import ServicesPageComponent from '@/pages/ServicesPage';

export default ServicesPageComponent;

export const getStaticProps: GetStaticProps = async () => {
    // ISR: Revalidate services page every hour since services list changes rarely
    return { props: {}, revalidate: 3600 };
};
