import { GetStaticProps } from 'next';
import AboutPage from '@/pages/AboutPage';
export default AboutPage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
