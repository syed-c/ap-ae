import { GetServerSideProps } from 'next';
import DentistPageComponent from '@/pages/DentistPage';

export default DentistPageComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
