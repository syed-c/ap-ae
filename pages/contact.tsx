import { GetServerSideProps } from 'next';
import ContactPage from '@/pages/ContactPage';
export default ContactPage;
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });
