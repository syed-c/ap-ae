import { GetServerSideProps } from 'next';
import AuthPage from '@/pages/Auth';

export default AuthPage;

export const getServerSideProps: GetServerSideProps = async () => {
    return { props: {} };
};
