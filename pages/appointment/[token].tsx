import { GetServerSideProps } from 'next';
import AppointmentManagePage from '@/pages/AppointmentManagePage';
export default AppointmentManagePage;
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });
