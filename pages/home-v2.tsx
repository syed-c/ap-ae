import { GetStaticProps } from 'next';
import HomeV2 from '@/pages/HomeV2';
export default HomeV2;

// ISR: Revalidate HomeV2 every 5 minutes to keep content fresh
export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 300 });
