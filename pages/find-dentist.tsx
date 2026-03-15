import { GetStaticProps } from 'next';

// Redirect /find-dentist to /search
export default function FindDentistRedirect() {
    return null;
}

export const getStaticProps: GetStaticProps = async () => {
    return {
        redirect: {
            destination: '/search',
            permanent: true,
        },
    };
};
