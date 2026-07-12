require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function auditPageContent() {
  console.log('\n' + '='.repeat(70));
  console.log('PAGE_CONTENT TABLE AUDIT (ONLY)');
  console.log('='.repeat(70));

  // Basic counts
  const { count: total } = await supabase.from('page_content').select('*', { count: 'exact', head: true });
  const { count: published } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).eq('is_published', true);
  const { count: withMetaTitle } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('meta_title', 'is', null);
  const { count: withMetaDesc } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('meta_description', 'is', null);
  const { count: withH1 } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('h1', 'is', null);
  const { count: withHeroIntro } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('hero_intro', 'is', null);
  const { count: withSection1 } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('section_1_content', 'is', null);
  const { count: withSection2 } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('section_2_content', 'is', null);
  const { count: withSection3 } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('section_3_content', 'is', null);
  const { count: withBody } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('body_content', 'is', null);
  const { count: withFaqs } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('faqs', 'is', null);
  const { count: withPrice } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).not('price_min', 'is', null);
  const { count: medicalVerified } = await supabase.from('page_content').select('*', { count: 'exact', head: true }).eq('medical_accuracy_verified', true);

  console.log(`\n📊 OVERVIEW:`);
  console.log(`  Total entries: ${total}`);
  console.log(`  Published: ${published} (${(published/total*100).toFixed(1)}%)`);

  console.log(`\n📝 CONTENT STRUCTURE:`);
  console.log(`  With meta_title: ${withMetaTitle} (${(withMetaTitle/total*100).toFixed(1)}%)`);
  console.log(`  With meta_description: ${withMetaDesc} (${(withMetaDesc/total*100).toFixed(1)}%)`);
  console.log(`  With h1: ${withH1} (${(withH1/total*100).toFixed(1)}%)`);
  console.log(`  With hero_intro: ${withHeroIntro} (${(withHeroIntro/total*100).toFixed(1)}%)`);
  console.log(`  With section_1: ${withSection1} (${(withSection1/total*100).toFixed(1)}%)`);
  console.log(`  With section_2: ${withSection2} (${(withSection2/total*100).toFixed(1)}%)`);
  console.log(`  With section_3: ${withSection3} (${(withSection3/total*100).toFixed(1)}%)`);
  console.log(`  With body_content: ${withBody} (${(withBody/total*100).toFixed(1)}%)`);
  console.log(`  With FAQs: ${withFaqs} (${(withFaqs/total*100).toFixed(1)}%)`);
  console.log(`  With price: ${withPrice} (${(withPrice/total*100).toFixed(1)}%)`);
  console.log(`  Medical verified: ${medicalVerified}`);

  // Get all data
  const { data: pages } = await supabase.from('page_content').select('page_type, page_slug, meta_title, h1, hero_intro, section_1_title, section_2_title, section_3_title, faqs, is_published, price_min, price_max');

  // Group by type
  const byType = {};
  pages?.forEach(p => {
    byType[p.page_type] = (byType[p.page_type] || 0) + 1;
  });

  console.log(`\n🔗 BY PAGE_TYPE:`);
  Object.entries(byType).forEach(([type, count]) => console.log(`  ${type}: ${count}`));

  // Show all pages
  console.log(`\n📋 ALL ${total} PAGE_CONTENT ENTRIES:`);
  pages?.forEach((p, i) => {
    const faqCount = p.faqs ? p.faqs.length : 0;
    const sections = [p.section_1_title ? 'S1' : '-', p.section_2_title ? 'S2' : '-', p.section_3_title ? 'S3' : '-'].join('|');
    console.log(`${i+1}. [${p.page_type}] /${p.page_slug} | ${p.is_published ? '✅' : '❌'} | h1: ${p.h1?.substring(0,30) || '-'}... | secs: ${sections} | FAQs: ${faqCount} | price: ${p.price_min || '-'}-${p.price_max || '-'}`);
  });

  console.log('\n' + '='.repeat(70));
  
  process.exit(0);
}

auditPageContent().catch(console.error);
