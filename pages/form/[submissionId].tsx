import { GetStaticProps } from 'next';
import Head from 'next/head';
import PatientFormPage from '@/pages/PatientFormPage';

export default function FormPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <PatientFormPage />
    </>
  );
}
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
