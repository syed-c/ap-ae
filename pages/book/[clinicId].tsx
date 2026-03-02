import { GetServerSideProps } from 'next';
import BookDirectPage from '@/pages/BookDirectPage';
export default BookDirectPage;
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });
