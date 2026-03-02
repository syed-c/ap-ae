import { GetServerSideProps } from 'next';
import SearchPageComponent from '@/pages/SearchPage';

export default SearchPageComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
