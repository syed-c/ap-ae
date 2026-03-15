import { GetStaticProps } from 'next';
import InsurancePage from '@/pages/InsurancePage';
export default InsurancePage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
