import { GetServerSideProps } from 'next';

// Redirect /find-dentist to /search
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
