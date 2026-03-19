import { GetStaticProps } from 'next';
import EmergencyDentistPage from '@/pages/EmergencyDentist';
export default EmergencyDentistPage;

// ISR: Revalidate every 5 minutes to keep emergency dentist listings fresh
export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 300 });
