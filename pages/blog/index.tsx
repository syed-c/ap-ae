import { GetServerSideProps } from 'next';
import BlogPageComponent from '@/pages/BlogPage';

export default BlogPageComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
