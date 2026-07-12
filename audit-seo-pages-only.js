require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function auditSeoPages() {
  console.log('\n' + '='.repeat(70));
  console.log('SEO_PAGES TABLE AUDIT');
  console.log('='.repeat(70));

  // Basic counts
  const { count: total } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true });
  const { count: published } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('is_published', true);
  const { count: withContent } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('content', 'is', null);
  const { count: withMetaTitle } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('meta_title', 'is', null);
  const { count: withMetaDesc } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('meta_description', 'is', null);
  const { count: withH1 } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('h1', 'is', null);
  const { count: withFaqs } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('faqs', 'is', null);
  const { count: withPrice } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).not('price_min', 'is', null);
  const { count: thin } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('is_thin_content', true);
  const { count: dup } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('is_duplicate', true);
  const { count: needsOpt } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('needs_optimization', true);
  const { count: indexed } = await supabase.from('seo_pages').select('*', { count: 'exact', head: true }).eq('is_indexed', true);

  console.log(`\n📊 OVERVIEW:`);
  console.log(`  Total pages: ${total}`);
  console.log(`  Published: ${published} (${(published/total*100).toFixed(1)}%)`);
  console.log(`  Unpublished: ${total - published}`);
  
  console.log(`\n📝 CONTENT FIELDS:`);
  console.log(`  With content: ${withContent} (${(withContent/total*100).toFixed(1)}%)`);
  console.log(`  With meta_title: ${withMetaTitle} (${(withMetaTitle/total*100).toFixed(1)}%)`);
  console.log(`  With meta_description: ${withMetaDesc} (${(withMetaDesc/total*100).toFixed(1)}%)`);
  console.log(`  With H1: ${withH1} (${(withH1/total*100).toFixed(1)}%)`);
  console.log(`  With FAQs: ${withFaqs} (${(withFaqs/total*100).toFixed(1)}%)`);
  console.log(`  With price range: ${withPrice} (${(withPrice/total*100).toFixed(1)}%)`);
  
  console.log(`\n⚠️ ISSUES:`);
  console.log(`  Thin content: ${thin}`);
  console.log(`  Duplicates: ${dup}`);
  console.log(`  Needs optimization: ${needsOpt}`);
  console.log(`  Is indexed: ${indexed}`);

  // Get all data for detailed analysis
  const { data: pages } = await supabase.from('seo_pages').select('slug, is_published, content, meta_title, meta_description, h1, faqs, word_count, seo_score, price_min, price_max');

  // Categorize by slug pattern
  const patterns = {};
  pages?.forEach(p => {
    const slug = p.slug || '';
    let pattern = 'other';
    if (slug.startsWith('services/')) pattern = 'service';
    else if (slug.split('/').length === 1) pattern = 'state';
    else if (slug.split('/').length === 2 && slug.includes('/')) pattern = 'city';
    else if (slug.split('/').length === 3) pattern = 'service-location';
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  });

  console.log(`\n🔗 SLUG PATTERNS:`);
  Object.entries(patterns).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // Show all slugs
  console.log(`\n📋 ALL 147 SEO_PAGES:`);
  pages?.forEach((p, i) => {
    console.log(`${i+1}. /${p.slug} | pub:${p.is_published} | words:${p.word_count || 0} | price:${p.price_min || '-'}-${p.price_max || '-'}`);
  });

  // Word count stats
  const wordCounts = pages?.filter(p => p.word_count > 0).map(p => p.word_count) || [];
  if (wordCounts.length) {
    const avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const max = Math.max(...wordCounts);
    const min = Math.min(...wordCounts);
    console.log(`\n📈 WORD COUNT STATS:`);
    console.log(`  Average: ${Math.round(avg)}`);
    console.log(`  Max: ${max}`);
    console.log(`  Min: ${min}`);
  }

  // SEO Scores only
  const scores = pages?.filter(p => p.seo_score > 0).map(p => p.seo_score) || [];
  if (scores.length) {
    const good = scores.filter(s => s >= 70).length;
    const med = scores.filter(s => s >= 40 && s < 70).length;
    const poor = scores.filter(s => s < 40).length;
    console.log(`\n📈 SEO_SCORE DISTRIBUTION:`);
    console.log(`  Good (70+): ${good} (${(good/scores.length*100).toFixed(1)}%)`);
    console.log(`  Medium (40-69): ${med} (${(med/scores.length*100).toFixed(1)}%)`);
    console.log(`  Poor (<40): ${poor} (${(poor/scores.length*100).toFixed(1)}%)`);
  } else {
    console.log(`\n📈 SEO_SCORE: All 0 or null`);
  }

  console.log('\n' + '='.repeat(70));
  
  process.exit(0);
}

auditSeoPages().catch(console.error);
