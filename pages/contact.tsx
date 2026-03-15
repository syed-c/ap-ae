import { GetStaticProps } from 'next';
import ContactPage from '@/pages/ContactPage';
export default ContactPage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
