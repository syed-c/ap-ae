import { GetServerSideProps } from 'next';
import AuthCallbackComponent from '@/pages/AuthCallback';

export default AuthCallbackComponent;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
