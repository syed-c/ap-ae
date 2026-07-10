import { GetStaticProps } from 'next';
import Head from 'next/head';
import AppointmentManagePage from '@/pages/AppointmentManagePage';

export default function AppointmentPage() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AppointmentManagePage />
    </>
  );
}
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
