import { GetStaticProps } from 'next';
import Head from 'next/head';
import IndexPage from '@/pages/Index';

export default function IndexPageWithSEO({ seoData }: { seoData: { title: string; description: string } }) {
  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
      </Head>
      <IndexPage />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Minimal SEO data - let client fetch the rest
  const metaTitle = 'AppointPanda - Find & Book Dental Appointments in UAE';
  const metaDescription = 'Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking.';

  return {
    props: {
      seoData: {
        title: metaTitle,
        description: metaDescription,
      }
    },
  };
};

        const cityIdSet = new Set(cityIds);
        const stateIdSet = new Set<string>();
        (citiesData || []).forEach(city => {
          if (cityIdSet.has(city.id) && city.state_id) {
            stateIdSet.add(city.state_id);
          }
        });

        return allStates.filter(state => stateIdSet.has(state.id));
      }
    }),

    // Prefetch Top Dentists - ONE per location across all Emirates
    queryClient.prefetchQuery({
      queryKey: ['top-dentists-per-location', 30],
      queryFn: async () => {
        // Get all active states (Emirates)
        const { data: states } = await supabase
          .from('states')
          .select('id, name, slug')
          .eq('is_active', true)
          .in('slug', ACTIVE_STATE_SLUGS)
          .order('display_order');

        if (!states?.length) return [];

        // Get all active cities grouped by state
        const { data: cities } = await supabase
          .from('cities')
          .select('id, name, state_id, slug')
          .eq('is_active', true)
          .not('state_id', 'is', null);

        if (!cities?.length) return [];

        // Group cities by state
        const citiesByState = cities.reduce((acc: any, city) => {
          if (!acc[city.state_id]) acc[city.state_id] = [];
          acc[city.state_id].push(city);
          return acc;
        }, {});

        let allProfiles: any[] = [];

        // For each state, get the top-rated dentist/clinic WITH IMAGE
        for (const state of states) {
          const stateCities = citiesByState[state.id] || [];
          const cityIds = stateCities.map((c: any) => c.id);

          if (cityIds.length === 0) continue;

          // Get top clinics from this state with images only
          const { data: topClinic } = await supabase
            .from('clinics')
            .select(`
              id, name, slug, description, cover_image_url, rating, review_count, address,
              city:cities(name, state:states(name, slug))
            `)
            .in('city_id', cityIds)
            .eq('is_active', true)
            .not('cover_image_url', 'is', null) // MUST have image
            .not('cover_image_url', 'eq', '')
            .gte('rating', 4.0) // At least 4.0 rating
            .gte('review_count', 5) // At least 5 reviews
            .order('rating', { ascending: false })
            .order('review_count', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (topClinic && topClinic.cover_image_url) {
            allProfiles.push({
              id: topClinic.id,
              name: topClinic.name,
              slug: topClinic.slug,
              type: 'clinic',
              specialty: 'Dental Clinic',
              location: topClinic.city ? `${topClinic.city.name}, ${topClinic.city.state?.name || state.name}` : state.name,
              rating: topClinic.rating || 0,
              reviewCount: topClinic.review_count || 0,
              image: topClinic.cover_image_url,
              score: (topClinic.rating || 0) * Math.log10((topClinic.review_count || 0) + 1),
              stateSlug: state.slug,
            });
          } else {
            // If no clinic with image found, try to get a dentist from this state
            const { data: topDentist } = await (supabase
              .from('dentists')
              .select(`
                id, name, slug, title, specializations, rating, review_count, photo_url,
                clinic:clinics(city:cities(name, state_id, state:states(name, slug)))
              `) as any)
              .eq('is_active', true)
              .not('photo_url', 'is', null) // MUST have image
              .not('photo_url', 'eq', '')
              .gte('rating', 4.0) // At least 4.0 rating
              .gte('review_count', 3) // At least 3 reviews
              .order('rating', { ascending: false })
              .order('review_count', { ascending: false })
              .limit(50); // Get more to filter by state

            // Filter dentists by state
            const dentistsInState = (topDentist || []).filter((d: any) => 
              d.clinic?.city?.state_id === state.id
            );

            if (dentistsInState.length > 0) {
              const d = dentistsInState[0];
              allProfiles.push({
                id: d.id,
                name: d.name,
                slug: d.slug,
                type: 'dentist',
                specialty: Array.isArray(d.specializations) && d.specializations.length > 0 ? d.specializations[0] : d.title || 'Dentist',
                location: d.clinic?.city ? `${d.clinic.city.name}, ${d.clinic.city.state?.name || state.name}` : state.name,
                rating: d.rating || 0,
                reviewCount: d.review_count || 0,
                image: d.photo_url,
                score: (d.rating || 0) * Math.log10((d.review_count || 0) + 1),
                stateSlug: state.slug,
              });
            }
          }
        }

        // Sort by score (best first)
        allProfiles.sort((a, b) => b.score - a.score);

        return allProfiles;
      }
    }),

    // Prefetch Real Counts
    queryClient.prefetchQuery({
      queryKey: ['real-counts'],
      queryFn: async () => {
        const [clinicsResponse, dentistsResponse, citiesResponse] = await Promise.all([
          supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('is_duplicate', false),
          supabase.from('dentists').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('cities').select('*', { count: 'exact', head: true }).eq('is_active', true)
        ]);
        return {
          clinics: clinicsResponse.count || 0,
          dentists: dentistsResponse.count || 0,
          cities: citiesResponse.count || 0
        };
      }
    })
  ]);

  const seoContent = queryClient.getQueryData<any>(['seo-page-content', '/']);
  
  const metaTitle = seoContent?.meta_title || 'AppointPanda - Find & Book Dental Appointments in UAE';
  const metaDescription = seoContent?.meta_description || 'Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking.';

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      seoData: {
        title: metaTitle,
        description: metaDescription,
      }
    },
  };
};
