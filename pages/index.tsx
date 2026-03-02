import dynamic from 'next/dynamic';
import { GetServerSideProps } from 'next';

const App = dynamic(() => import('@/App'));

export default function Index(props: any) {
  return <App {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ssrPath: '/',
    },
  };
};
