import { GetStaticProps } from 'next';
import ClaimProfilePage from '@/pages/ClaimProfilePage';
export default ClaimProfilePage;

// ISR: Revalidate every hour since claim profile page content changes rarely
export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 3600 });
