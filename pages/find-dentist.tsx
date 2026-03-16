import { GetStaticProps } from 'next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Redirect /find-dentist to /search
export default function FindDentistRedirect() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace('/search');
    }, [router]);
    
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    return {
        props: {},
    };
};
