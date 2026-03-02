import { GetServerSideProps } from 'next';
import DentalCostCalculator from '@/pages/tools/DentalCostCalculator';
export default DentalCostCalculator;
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });
