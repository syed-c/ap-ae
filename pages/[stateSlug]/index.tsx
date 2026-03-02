import { GetServerSideProps } from 'next';
import StatePageComponent from '@/pages/StatePage';

export default StatePageComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
