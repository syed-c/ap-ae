import { GetServerSideProps } from 'next';
import PatientFormPage from '@/pages/PatientFormPage';
export default PatientFormPage;
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });
