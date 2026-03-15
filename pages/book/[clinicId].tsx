import { GetStaticProps } from 'next';
import BookDirectPage from '@/pages/BookDirectPage';
export default BookDirectPage;
export const getServerSideProps: GetStaticProps = async () => ({ props: {} });
