import { GetStaticProps } from 'next';
import BlogPageComponent from '@/pages/BlogPage';

export default BlogPageComponent;

export const getStaticProps: GetStaticProps = async () => {
    // ISR: Revalidate blog page every 15 minutes for fresh post listings
    return { props: {}, revalidate: 900 };
};
