const fs = require('fs');
const path = require('path');

const buildDir = path.join(process.cwd(), '.next', 'server', 'pages');

const requiredPages = [
  { file: 'index.html', label: '/' },
  { file: 'blog.html', label: '/blog/' },
  { file: 'services.html', label: '/services/' },
  { file: 'about.html', label: '/about/' },
  { file: 'faq.html', label: '/faq/' },
];

function extractNextRootText(html) {
  const nextRootMatch = html.match(/<div id="__next">([\s\S]*?)<\/div><script/m);
  if (!nextRootMatch) {
    return '';
  }

  return nextRootMatch[1]
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertReadableHtml(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing built HTML file for ${label}: ${filePath}`);
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const text = extractNextRootText(html);

  if (text.length < 200) {
    throw new Error(`Built HTML for ${label} is too thin (${text.length} chars inside #__next)`);
  }

  if (/^loading\.{0,3}$/i.test(text)) {
    throw new Error(`Built HTML for ${label} only contains a loading shell`);
  }
}

for (const page of requiredPages) {
  assertReadableHtml(path.join(buildDir, page.file), page.label);
}

console.log('[audit-built-html] Verified non-trivial HTML output for sampled public pages.');
