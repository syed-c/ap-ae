import { GetServerSideProps } from 'next';
import ServicePageComponent from '@/pages/ServicePage';

export default ServicePageComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
