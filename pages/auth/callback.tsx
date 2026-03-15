import { GetStaticProps } from 'next';
import AuthCallbackComponent from '@/pages/AuthCallback';

export default AuthCallbackComponent;

export const getStaticProps: GetStaticProps = async () => {
    return { props: {} };
};
