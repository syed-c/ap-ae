import { GetStaticProps } from 'next';
import Head from 'next/head';
import DentalCostCalculator from '@/pages/tools/DentalCostCalculator';

export default function DentalCostCalculatorWithNoIndex() {
    return (
        <>
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <DentalCostCalculator />
        </>
    );
}

export const getStaticProps: GetStaticProps = async () => ({ props: {} });
