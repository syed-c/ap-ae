import { GetStaticProps } from 'next';
import SearchPageComponent from '@/pages/SearchPage';

export default SearchPageComponent;

export const getStaticProps: GetStaticProps = async () => {
    return { props: {} };
};
