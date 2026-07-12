require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function auditAll() {
  console.log('\n' + '='.repeat(70));
  console.log('COMPREHENSIVE DATABASE CONTENT AUDIT');
  console.log('='.repeat(70));

  // ========== SEO_PAGES ==========
  console.log('\n\n######### SEO_PAGES TABLE #########\n');
  
  const { count: totalSeoPages } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true });
  const { count: publishedSeoPages } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('is_published', true);
  const { count: withContent } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('content', 'is', null);
  const { count: withMetaTitle } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('meta_title', 'is', null);
  const { count: withMetaDesc } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('meta_description', 'is', null);
  const { count: withH1 } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('h1', 'is', null);
  const { count: withFaqs } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('faqs', 'is', null);
  const { count: thinContent } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('is_thin_content', true);
  const { count: duplicates } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('is_duplicate', true);
  const { count: needsOpt } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('needs_optimization', true);
  const { count: withPrice } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('price_min', 'is', null);

  console.log(`\n📊 OVERVIEW:`);
  console.log(`  Total pages: ${totalSeoPages}`);
  console.log(`  Published: ${publishedSeoPages} (${(publishedSeoPages/totalSeoPages*100).toFixed(1)}%)`);
  console.log(`  NOT Published: ${totalSeoPages - publishedSeoPages}`);
  
  console.log(`\n📝 CONTENT METRICS:`);
  console.log(`  With content: ${withContent}`);
  console.log(`  With meta_title: ${withMetaTitle}`);
  console.log(`  With meta_description: ${withMetaDesc}`);
  console.log(`  With H1: ${withH1}`);
  console.log(`  With FAQs: ${withFaqs}`);
  console.log(`  With price range: ${withPrice}`);
  
  console.log(`\n⚠️ ISSUES:`);
  console.log(`  Thin content: ${thinContent}`);
  console.log(`  Duplicates: ${duplicates}`);
  console.log(`  Needs optimization: ${needsOpt}`);

  // Get slug patterns
  const { data: allSeoPages } = await supabase.from('seo_pages').select('slug, page_type, is_published, content, word_count');
  
  const patterns = { 'state (/)': 0, 'city (/dubai/xxx)': 0, 'service (/services/xxx)': 0, 'location (/x/x/x)': 0, 'clinic (/clinic/xxx)': 0 };
  
  allSeoPages?.forEach(p => {
    const slug = p.slug || '';
    if (slug === 'dubai' || slug === 'abu-dhabi' || slug === 'sharjah') patterns['state (/)']++;
    else if (slug.startsWith('services/')) patterns['service (/services/xxx)']++;
    else if (slug.startsWith('dubai/') && slug.split('/').length === 2) patterns['city (/dubai/xxx)']++;
    else if (slug.split('/').length === 3) patterns['location (/x/x/x)']++;
    else if (slug.startsWith('clinic/')) patterns['clinic (/clinic/xxx)']++;
  });

  console.log(`\n🔗 SLUG PATTERNS:`);
  Object.entries(patterns).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // Sample unpublished
  const unpublished = allSeoPages?.filter(p => !p.is_published) || [];
  console.log(`\n❌ UNPUBLISHED PAGES (first 10):`);
  unpublished.slice(0, 10).forEach(p => console.log(`  /${p.slug}`));

  // ========== CITIES ==========
  console.log('\n\n######### CITIES TABLE #########\n');
  
  const { count: totalCities } = await supabase.from('cities').select('*', { count: 'exact', head: true });
  const { count: activeCities } = await supabase.from('cities').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: citiesWithSeoPage } = await supabase.from('cities').select('*', { count: 'exact', head: true }).not('seo_page_id', 'is', null);
  const { count: citiesWithPop } = await supabase.from('cities').select('*', { count: 'exact', head: true }).gt('population', 0);
  
  console.log(`\n📊 OVERVIEW:`);
  console.log(`  Total cities: ${totalCities}`);
  console.log(`  Active: ${activeCities}`);
  console.log(`  With seo_page_id linked: ${citiesWithSeoPage}`);
  console.log(`  With population: ${citiesWithPop}`);

  const { data: citiesData } = await supabase.from('cities').select('name, slug, dentist_count, seo_status, page_exists').order('dentist_count', { ascending: false }).limit(15);
  console.log(`\n📋 TOP 15 CITIES BY DENTIST COUNT:`);
  citiesData?.forEach(c => console.log(`  ${c.name}: ${c.dentist_count} dentists, status: ${c.seo_status}, page_exists: ${c.page_exists}`));

  // ========== STATES ==========
  console.log('\n\n######### STATES TABLE #########\n');
  
  const { count: totalStates } = await supabase.from('states').select('*', { count: 'exact', head: true });
  const { count: activeStates } = await supabase.from('states').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: statesWithSeoPage } = await supabase.from('states').select('*', { count: 'exact', head: true }).not('seo_page_id', 'is', null);
  
  console.log(`\n📊 OVERVIEW:`);
  console.log(`  Total states: ${totalStates}`);
  console.log(`  Active: ${activeStates}`);
  console.log(`  With seo_page_id: ${statesWithSeoPage}`);

  const { data: statesData } = await supabase.from('states').select('name, slug, abbreviation, dentist_count, clinic_count, seo_status, page_exists').order('display_order');
  console.log(`\n📋 ALL STATES:`);
  statesData?.forEach(s => console.log(`  ${s.name} (${s.abbreviation}): ${s.dentist_count} dentists, ${s.clinic_count} clinics, status: ${s.seo_status}, page_exists: ${s.page_exists}`));

  // ========== PAGE_CONTENT ==========
  console.log('\n\n######### PAGE_CONTENT TABLE #########\n');
  
  const { count: totalPageContent } = await supabase.from('page_content').select('*', { count: 'exact', head: true });
  const { count: publishedPageContent } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).eq('is_published', true);
  const { count: withHeroIntro } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('hero_intro', 'is', null);
  const { count: withSection1 } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('section_1_content', 'is', null);
  const { count: withBodyContent } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('body_content', 'is', null);
  const { count: withFaqsPageContent } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('faqs', 'is', null);
  const { count: medicalVerified } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).eq('medical_accuracy_verified', true);

  console.log(`\n📊 OVERVIEW:`);
  console.log(`  Total entries: ${totalPageContent}`);
  console.log(`  Published: ${publishedPageContent}`);
  
  console.log(`\n📝 CONTENT FIELDS:`);
  console.log(`  With hero_intro: ${withHeroIntro}`);
  console.log(`  With section_1: ${withSection1}`);
  console.log(`  With body_content: ${withBodyContent}`);
  console.log(`  With FAQs: ${withFaqsPageContent}`);
  console.log(`  Medical verified: ${medicalVerified}`);

  const { data: pageContentData } = await supabase.from('page_content').select('page_type, page_slug, meta_title, h1, is_published');
  console.log(`\n📋 ALL PAGE_CONTENT ENTRIES:`);
  pageContentData?.forEach(p => console.log(`  [${p.page_type}] /${p.page_slug} - ${p.is_published ? '✅' : '❌'}`));

  // ========== GOOGLE VISIBILITY CHECK ==========
  console.log('\n\n######### GOOGLE VISIBILITY ANALYSIS #########\n');
  
  console.log(`
🔍 HOW GOOGLE SEES CONTENT:

✅ SSG PAGES (getStaticProps - Google can see):
   - pages/[stateSlug]/index.tsx → fetches from seo_pages
   - pages/[stateSlug]/[citySlug]/index.tsx → fetches from seo_pages  
   - pages/services/[serviceSlug].tsx → fetches from seo_pages + page_content
   - pages/clinic/[clinicSlug].tsx → fetches from clinics table
   - pages/[stateSlug]/[citySlug]/[serviceSlug].tsx → fetches from seo_pages

❌ CLIENT-SIDE PAGES (useQuery - Google CANNOT see):
   - pages/blog/[postSlug].tsx → uses useQuery (needs fix)
   - pages/search.tsx → uses client-side fetch

📊 SEO_PAGES: ${withContent}/${totalSeoPages} have content (${(withContent/totalSeoPages*100).toFixed(1)}%)
📊 PAGE_CONTENT: ${withBodyContent}/${totalPageContent} have body_content (${(withBodyContent/totalPageContent*100).toFixed(1)}%)
  `);

  // ========== CONTENT QUALITY SCORES ==========
  console.log('\n######### CONTENT QUALITY ASSESSMENT #########\n');
  
  // Get score distributions for seo_pages
  const { data: scoresData } = await supabase.from('seo_pages').select('seo_score, identity_score, page_value_score').not('seo_score', 'is', null);
  if (scoresData?.length) {
    const goodSeo = scoresData.filter(s => s.seo_score >= 70).length;
    const medSeo = scoresData.filter(s => s.seo_score >= 40 && s.seo_score < 70).length;
    const poorSeo = scoresData.filter(s => s.seo_score < 40).length;
    console.log(`\n📈 SEO_SCORE DISTRIBUTION (seo_pages):`);
    console.log(`  Good (70+): ${goodSeo} (${(goodSeo/scoresData.length*100).toFixed(1)}%)`);
    console.log(`  Medium (40-69): ${medSeo} (${(medSeo/scoresData.length*100).toFixed(1)}%)`);
    console.log(`  Poor (<40): ${poorSeo} (${(poorSeo/scoresData.length*100).toFixed(1)}%)`);
  }

  const { data: identityScores } = await supabase.from('seo_pages').select('identity_score').not('identity_score', 'is', null);
  if (identityScores?.length) {
    const goodId = identityScores.filter(s => s.identity_score >= 70).length;
    console.log(`\n🆔 IDENTITY_SCORE: ${goodId}/${identityScores.length} have good identity (local content)`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(70));

  process.exit(0);
}

auditAll().catch(console.error);
