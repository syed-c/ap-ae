import { GetServerSideProps } from 'next';
import IndexPage from '@/pages/Index';

export default IndexPage;

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
