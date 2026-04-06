import { GetStaticProps } from 'next';
import AboutPage from '@/pages/AboutPage';
export default AboutPage;

// ISR: Revalidate every hour since about page content changes rarely
export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 1800 });
