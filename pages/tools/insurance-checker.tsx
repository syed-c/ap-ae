import { GetStaticProps } from 'next';
import Head from 'next/head';
import InsuranceChecker from '@/pages/tools/InsuranceChecker';

export default function InsuranceCheckerWithNoIndex() {
    return (
        <>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <InsuranceChecker />
        </>
    );
}

export const getStaticProps: GetStaticProps = async () => ({ props: {} });
