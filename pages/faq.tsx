import { GetStaticProps } from 'next';
import FAQPage from '@/pages/FAQPage';
export default FAQPage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
