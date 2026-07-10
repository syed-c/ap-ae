import { GetStaticProps } from 'next';
import Head from 'next/head';
import ReviewFunnelPage from '@/pages/ReviewFunnelPage';

export default function ReviewPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <ReviewFunnelPage />
    </>
  );
}
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
