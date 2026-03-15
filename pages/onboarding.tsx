import { GetStaticProps } from 'next';
import GMBOnboarding from '@/pages/GMBOnboarding';
export default GMBOnboarding;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
