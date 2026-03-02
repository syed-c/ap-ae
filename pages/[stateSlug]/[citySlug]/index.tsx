import { GetServerSideProps } from 'next';
import CityPageComponent from '@/pages/CityPage';

export default CityPageComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
