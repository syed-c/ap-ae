import { GetStaticProps } from 'next';
import Head from 'next/head';
import AuthPage from '@/pages/Auth';

export default function AuthPageWithNoIndex() {
    return (
        <>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <AuthPage />
        </>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    return { props: {} };
};
