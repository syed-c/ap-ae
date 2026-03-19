import { GetStaticProps } from 'next';
import SearchPageComponent from '@/pages/SearchPage';

export default SearchPageComponent;

export const getStaticProps: GetStaticProps = async () => {
    // ISR: Revalidate search page every 5 minutes
    // This helps keep search-related content fresh
    return { props: {}, revalidate: 300 };
};
