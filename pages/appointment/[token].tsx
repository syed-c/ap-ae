import { GetStaticProps } from 'next';
import AppointmentManagePage from '@/pages/AppointmentManagePage';
export default AppointmentManagePage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
