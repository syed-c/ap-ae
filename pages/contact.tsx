import { GetStaticProps } from 'next';
import ContactPage from '@/pages/ContactPage';
export default ContactPage;

// ISR: Revalidate every hour since contact page content changes rarely
export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 3600 });
