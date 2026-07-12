import { GetServerSideProps } from 'next';
import GMBOnboarding from '@/pages/GMBOnboarding';
export default GMBOnboarding;
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieHeader = req.headers.cookie || '';
  const hasAuthCookie = cookieHeader.includes('sb-eneuthbghipsdvsqilmb-auth-token') || cookieHeader.includes('sb-');

  if (!hasAuthCookie) {
    return {
      redirect: { destination: '/auth', permanent: false },
    };
  }

  return { props: {} };
};
