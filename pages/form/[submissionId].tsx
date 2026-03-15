import { GetStaticProps } from 'next';
import PatientFormPage from '@/pages/PatientFormPage';
export default PatientFormPage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
