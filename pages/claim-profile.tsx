import { GetServerSideProps } from 'next';
import ClaimProfilePage from '@/pages/ClaimProfilePage';
export default ClaimProfilePage;

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieHeader = req.headers.cookie || '';
  const hasAuthCookie = cookieHeader.includes('sb-eneuthbghipsdvsqilmb-auth-token') || cookieHeader.includes('sb-');

  if (!hasAuthCookie) {
    return {
      redirect: { destination: '/auth?redirect=/claim-profile', permanent: false },
    };
  }

  return { props: {} };
};
