import { GetServerSideProps } from 'next';
import InsuranceChecker from '@/pages/tools/InsuranceChecker';
export default InsuranceChecker;
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });
