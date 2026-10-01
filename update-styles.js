const fs = require('fs');
const glob = require('glob');

const themeStr = `import { theme } from "../constants/theme";`;

const files = glob.sync('app/**/*.tsx');

files.forEach(file => {
  if (file === 'app/index.tsx') return;
  
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add theme import if not exists
  if (!content.includes('constants/theme') && (
      content.includes('#fff') || 
      content.includes('#111') || 
      content.includes('#f6f7fb') || 
      content.includes('#000') ||
      content.includes('backgroundColor')
    )) {
    // find last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLine + 1) + 'import { theme } from "../constants/theme";\n' + content.slice(endOfLine + 1);
      changed = true;
    }
  }

  // Replace colors
  const replacements = [
    { from: /backgroundColor:\s*["']#f6f7fb["']/g, to: 'backgroundColor: theme.colors.background' },
    { from: /backgroundColor:\s*["']#fff["']/g, to: 'backgroundColor: theme.colors.card' },
    { from: /backgroundColor:\s*["']#111["']/g, to: 'backgroundColor: theme.colors.primary' },
    { from: /color:\s*["']#111["']/g, to: 'color: theme.colors.text' },
    { from: /color:\s*["']#000["']/g, to: 'color: theme.colors.text' },
    { from: /color:\s*["']#fff["']/g, to: 'color: theme.colors.text' },
    { from: /color:\s*["']#666["']/g, to: 'color: theme.colors.textSecondary' },
    { from: /color:\s*["']#444["']/g, to: 'color: theme.colors.textSecondary' },
    { from: /color:\s*["']#b42318["']/g, to: 'color: theme.colors.danger' },
    { from: /color:\s*["']red["']/g, to: 'color: theme.colors.danger' },
    { from: /borderColor:\s*["']#eef1f5["']/g, to: 'borderColor: theme.colors.cardBorder' },
    { from: /borderColor:\s*["']#d8dce6["']/g, to: 'borderColor: theme.colors.cardBorder' },
    { from: /borderColor:\s*["']#eee["']/g, to: 'borderColor: theme.colors.cardBorder' },
    { from: /placeholderTextColor=["']#444["']/g, to: 'placeholderTextColor={theme.colors.textSecondary}' },
    { from: /placeholderTextColor=["']#999["']/g, to: 'placeholderTextColor={theme.colors.textSecondary}' }
  ];

  replacements.forEach(r => {
    if (r.from.test(content)) {
      content = content.replace(r.from, r.to);
      changed = true;
    }
  });
  
  if (content.includes('borderTopColor: "#eef1f5"')) {
      content = content.replace(/borderTopColor:\s*["']#eef1f5["']/g, 'borderTopColor: theme.colors.cardBorder');
      changed = true;
  }
  if (content.includes('borderBottomColor: "#eee"')) {
      content = content.replace(/borderBottomColor:\s*["']#eee["']/g, 'borderBottomColor: theme.colors.cardBorder');
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
