import { GetStaticPaths, GetStaticProps } from 'next';
import EmirateComparisonPage from '@/pages/EmirateComparisonPage';
import { createServerSupabase } from '@/lib/supabaseServer';

interface Props {
  faqsProp?: { q: string; a: string }[];
  seoDataProp?: { title?: string; description?: string; canonical?: string };
}

export default function ComparePage(props: Props) {
  return <EmirateComparisonPage {...props} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const supabase = createServerSupabase();
  const { data: treatments } = await supabase
    .from('treatments')
    .select('slug')
    .eq('is_active', true)
    .not('slug', 'is', null);

  const { data: states } = await supabase
    .from('states')
    .select('slug')
    .eq('is_active', true)
    .not('slug', 'is', null);

  const paths: { params: { comparison: string } }[] = [];

  for (const treatment of treatments || []) {
    for (let i = 0; i < (states?.length || 0); i++) {
      for (let j = i + 1; j < (states?.length || 0); j++) {
        paths.push({
          params: {
            comparison: `${treatment.slug}/${states![i].slug}-vs-${states![j].slug}`,
          },
        });
      }
    }
  }

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const supabase = createServerSupabase();
  const comparison = params?.comparison as string;
  const seoSlug = `compare/${comparison}`;

  let faqsProp: { q: string; a: string }[] | undefined;
  let seoDataProp: Props['seoDataProp'] = undefined;

  try {
    const { data: pageContent } = await supabase
      .from('page_content')
      .select('meta_title, meta_description, faqs')
      .eq('page_slug', seoSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (pageContent) {
      if (pageContent.faqs && Array.isArray(pageContent.faqs)) {
        faqsProp = pageContent.faqs.map((f: { question: string; answer: string }) => ({
          q: f.question,
          a: f.answer,
        }));
      }
      seoDataProp = {
        title: pageContent.meta_title || undefined,
        description: pageContent.meta_description || undefined,
      };
    }

    if (!pageContent) {
      const { data: seoPage } = await supabase
        .from('seo_pages')
        .select('meta_title, meta_description, faqs')
        .eq('slug', seoSlug)
        .maybeSingle();

      if (seoPage) {
        if (seoPage.faqs && Array.isArray(seoPage.faqs)) {
          faqsProp = seoPage.faqs.map((f: { question: string; answer: string }) => ({
            q: f.question,
            a: f.answer,
          }));
        }
        seoDataProp = {
          title: seoPage.meta_title || undefined,
          description: seoPage.meta_description || undefined,
        };
      }
    }
  } catch (e) {
    console.error('Error fetching SEO content for', seoSlug, e);
  }

  return {
    props: {
      faqsProp: faqsProp ?? null,
      seoDataProp: seoDataProp ?? null,
    },
    revalidate: 3600,
  };
};
