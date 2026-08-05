const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace rounded-full, rounded-md, rounded-lg, rounded-xl, rounded-2xl, rounded-3xl with rounded-none
  // We'll leave `rounded` and `rounded-sm` alone, or actually user wants it "square" (เหลี่ยม) so maybe we replace them all.
  let newContent = content.replace(/rounded-(full|md|lg|xl|2xl|3xl|\[.*?\])/g, 'rounded-none');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
