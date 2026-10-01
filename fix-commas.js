const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/**/*.tsx');
let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Find all instances of things like `marginBottom: 20     color: theme.colors.text,`
  // basically any missing comma before color: theme.colors.text
  content = content.replace(/([^,\{\s])(\s+)color:\s*theme\.colors\.text,/g, '$1,$2color: theme.colors.text,');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
  }
});
console.log('Fixed commas in ' + fixedCount + ' files');
