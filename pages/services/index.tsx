import { GetServerSideProps } from 'next';
import ServicesPageComponent from '@/pages/ServicesPage';

export default ServicesPageComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
