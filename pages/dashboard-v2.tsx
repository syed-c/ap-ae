import { GetServerSideProps } from 'next';

export default function DashboardV2Redirect() {
    return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
            destination: '/dashboard',
            permanent: true,
        },
    };
};
