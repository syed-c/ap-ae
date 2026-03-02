import { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import IndexPage from '@/pages/Index';
import { ACTIVE_STATE_SLUGS } from '@/lib/constants/activeStates';

export default IndexPage;

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = new QueryClient();
  const supabase = createServerSupabase();

  // Prefetch SEO Content
  await queryClient.prefetchQuery({
    queryKey: ['seo-page-content', '/'],
    queryFn: async () => {
      // First try to get optimized content
      const { data: optimizedData } = await supabase
        .from('seo_pages')
        .select('*')
        .in('slug', ['/', ''])
        .eq('is_optimized', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (optimizedData && optimizedData.content) {
        return optimizedData;
      }

      // Fallback to any content
      const { data: anyData } = await supabase
        .from('seo_pages')
        .select('*')
        .in('slug', ['/', ''])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return anyData || null;
    }
  });

  // Prefetch Homepage Treatments
  await queryClient.prefetchQuery({
    queryKey: ['homepage-treatments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatments')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order')
        .limit(12);
      return data || [];
    },
  });

  // Prefetch States with Clinics
  await queryClient.prefetchQuery({
    queryKey: ['states-with-clinics'],
    queryFn: async () => {
      // Use raw fetch logic similar to hook
      const { data: allStates } = await supabase
        .from('states')
        .select('*')
        .eq('is_active', true)
        .in('slug', ACTIVE_STATE_SLUGS)
        .order('display_order');

      if (!allStates || allStates.length === 0) return [];

      const { data: clinicsRaw } = await (supabase
        .from('clinics')
        .select('city_id') as any)
        .eq('is_active', true)
        .eq('is_duplicate', false);

      const clinics = clinicsRaw as Array<{ city_id: string | null }> | null;
      const cityIds = (clinics || []).map(c => c.city_id).filter((id): id is string => id !== null);

      if (cityIds.length === 0) return [];

      const { data: citiesRaw } = await supabase
        .from('cities')
        .select('id, state_id')
        .eq('is_active', true);

      const citiesData = citiesRaw as Array<{ id: string; state_id: string | null }> | null;

      const cityIdSet = new Set(cityIds);
      const stateIdSet = new Set<string>();
      (citiesData || []).forEach(city => {
        if (cityIdSet.has(city.id) && city.state_id) {
          stateIdSet.add(city.state_id);
        }
      });

      return allStates.filter(state => stateIdSet.has(state.id));
    }
  });

  // Prefetch Top Dentists 
  await queryClient.prefetchQuery({
    queryKey: ['top-dentists-per-location', 30],
    queryFn: async () => {
      const { data: popularCities } = await supabase
        .from('cities')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')
        .limit(10);

      if (!popularCities?.length) return [];

      let allProfiles: any[] = [];
      const cityIds = popularCities.map(c => c.id);

      const { data: topClinics } = await supabase
        .from('clinics')
        .select(`
          id, name, slug, description, cover_image_url, rating, review_count, address,
          city:cities(name, state:states(name))
        `)
        .in('city_id', cityIds)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(40); // slightly more to ensure we get good ones

      if (topClinics) {
        allProfiles = topClinics.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: 'clinic',
          specialty: 'Dental Clinic',
          location: c.city ? `${c.city.name}, ${c.city.state?.name || ''}` : 'UAE',
          rating: c.rating || 0,
          reviewCount: c.review_count || 0,
          image: c.cover_image_url,
          score: (c.rating || 0) * Math.log10((c.review_count || 0) + 1),
        }));
      }

      // Add actual dentists
      const { data: topDentists } = await (supabase
        .from('dentists')
        .select(`
          id, name, slug, title, specializations, rating, review_count, photo_url,
          clinic:clinics(city:cities(name, state:states(name)))
        `) as any)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(20);

      if (topDentists) {
        const dentistProfiles = topDentists.map((d: any) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          type: 'dentist',
          specialty: Array.isArray(d.specializations) && d.specializations.length > 0 ? d.specializations[0] : d.title || 'Dentist',
          location: d.clinic?.city ? `${d.clinic.city.name}, ${d.clinic.city.state?.name || ''}` : 'UAE',
          rating: d.rating || 0,
          reviewCount: d.review_count || 0,
          image: d.photo_url,
          score: (d.rating || 0) * Math.log10((d.review_count || 0) + 1),
        }));

        allProfiles = [...allProfiles, ...dentistProfiles];
      }

      // Sort by score and take top N
      allProfiles.sort((a, b) => b.score - a.score);
      const selected = allProfiles.slice(0, 30);

      // Shuffle the selected profiles deterministically based on date (rotates daily)
      const dateSeed = new Date().toDateString();
      let seed = 0;
      for (let i = 0; i < dateSeed.length; i++) {
        seed += dateSeed.charCodeAt(i);
      }

      const shuffled = [...selected];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor((seed * (i + 1)) % (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        seed = (seed * 9301 + 49297) % 233280;
      }

      return shuffled;
    }
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};
