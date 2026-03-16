import { GetStaticProps } from 'next';
import Head from 'next/head';
import IndexPage from '@/pages/Index';

export default function IndexPageWithSEO({ seoData }: { seoData: { title: string; description: string } }) {
  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
      </Head>
      <IndexPage />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const metaTitle = 'AppointPanda - Find & Book Dental Appointments in UAE';
  const metaDescription = 'Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking.';

  return {
    props: {
      seoData: {
        title: metaTitle,
        description: metaDescription,
      }
    },
  };
};
