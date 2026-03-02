import dynamic from 'next/dynamic';
import { GetServerSideProps } from 'next';

const App = dynamic(() => import('@/App'));

export default function CatchAll(props: any) {
  return <App {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { path } = context.query;
  const pathStr = Array.isArray(path) ? path.join('/') : path || '';

  return {
    props: {
      ssrPath: `/${pathStr}/`,
    },
  };
};
