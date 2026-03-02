import { GetServerSideProps } from 'next';
import ServiceLocationPage from '@/pages/ServiceLocationPage';

export default ServiceLocationPage;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
