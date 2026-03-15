import { GetStaticProps } from 'next';
import AuthPage from '@/pages/Auth';

export default AuthPage;

export const getStaticProps: GetStaticProps = async () => {
    return { props: {} };
};
