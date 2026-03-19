import { GetStaticProps } from 'next';
import GMBBusinessSelection from '@/pages/GMBBusinessSelection';
export default GMBBusinessSelection;

// ISR: Revalidate every hour since GMB selection page content changes rarely
export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 3600 });
