import { GetStaticProps } from 'next';
import FAQPage from '@/pages/FAQPage';
export default FAQPage;

// ISR: Revalidate every hour since FAQ content changes rarely
export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 3600 });
