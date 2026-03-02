const fs = require('fs');
const path = require('path');

function walk(dir, cb) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, cb);
    else if (p.endsWith('.tsx')) cb(p);
  }
}

let count = 0;
walk('src', (file) => {
  const content = fs.readFileSync(file, 'utf8');
  // Match <Link ...> or <Link\n...>
  const linkRegex = /<Link[\s\n]+([^>]*?)>/gs;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const props = match[1];
    
    // Ignore if it's not the next.js Link or imported as such, but we'll check all
    if (!props.includes('href=')) {
      console.log('Missing href in', file);
      console.log('   Props:', props.replace(/\n/g, ' '));
      count++;
    } else if (props.includes('href={undefined}') || props.includes('href={`/undefined')) {
      console.log('Undefined href in', file);
      console.log('   Props:', props.replace(/\n/g, ' '));
      count++;
    }
  }
});
console.log('Total potential issues:', count);
