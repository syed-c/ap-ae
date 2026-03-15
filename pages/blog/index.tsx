import { GetStaticProps } from 'next';
import BlogPageComponent from '@/pages/BlogPage';

export default BlogPageComponent;

export const getStaticProps: GetStaticProps = async () => {
    return { props: {} };
};
