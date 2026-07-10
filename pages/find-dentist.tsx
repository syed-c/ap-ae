import { GetServerSideProps } from 'next';

export default function FindDentistRedirect() {
    return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
    return {
        redirect: {
            destination: '/search',
            permanent: true,
        },
    };
};
