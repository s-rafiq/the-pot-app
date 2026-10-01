const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{app,components}/**/*.tsx');
let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Add import if needed
  if (content.includes('.toFixed(2)') && !content.includes('formatMoney')) {
    const importPath = file.startsWith('app/person/') || file.startsWith('app/edit-') 
      ? '../../utils/money' 
      : (file.startsWith('app/') ? '../utils/money' 
      : (file.startsWith('components/widget/') ? '../../utils/money' : '../utils/money'));
      
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLine + 1) + `import { formatMoney } from "${importPath}";\n` + content.slice(endOfLine + 1);
    } else {
      content = `import { formatMoney } from "${importPath}";\n` + content;
    }
  }

  // Replace various .toFixed(2) occurrences safely
  // Case 1: ${balance.toFixed(2)} -> ${formatMoney(balance)}
  content = content.replace(/\$\{([a-zA-Z0-9_]+)\.toFixed\(2\)\}/g, '${formatMoney($1)}');
  // Case 2: {balance.toFixed(2)} -> {formatMoney(balance)}
  content = content.replace(/\{([a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*)\.toFixed\(2\)\}/g, '{formatMoney($1)}');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
  }
});
console.log('Fixed ' + fixedCount + ' files');
