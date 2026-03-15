import { GetStaticProps } from 'next';
import ClaimProfilePage from '@/pages/ClaimProfilePage';
export default ClaimProfilePage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
