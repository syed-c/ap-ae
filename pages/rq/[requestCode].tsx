import { GetStaticProps } from 'next';
import Head from 'next/head';
import ReviewRequestPage from '@/pages/ReviewRequestPage';

export default function ReviewRequestPageWrapper() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <ReviewRequestPage />
    </>
  );
}
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
