import { GetServerSideProps } from 'next';
import ClinicPageComponent from '@/pages/ClinicPage';

export default ClinicPageComponent;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    return { props: {} };
};
