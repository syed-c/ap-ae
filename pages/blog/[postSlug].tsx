import { GetServerSideProps } from 'next';
import BlogPostPageComponent from '@/pages/BlogPostPage';

export default BlogPostPageComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
