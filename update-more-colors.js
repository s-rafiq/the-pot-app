const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/**/*.tsx');
let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/color:\s*["']#067647["']/g, 'color: theme.colors.success');
  content = content.replace(/color:\s*["']#fff["']/g, 'color: theme.colors.text');
  content = content.replace(/backgroundColor:\s*["']#111["']/g, 'backgroundColor: theme.colors.primary');
  content = content.replace(/backgroundColor:\s*["']#eef1f5["']/g, 'backgroundColor: theme.colors.cardBorder');
  content = content.replace(/borderTopColor:\s*["']#eee["']/g, 'borderTopColor: theme.colors.cardBorder');
  content = content.replace(/backgroundColor:\s*["']#eee["']/g, 'backgroundColor: theme.colors.cardBorder');
  content = content.replace(/borderColor:\s*["']#ddd["']/g, 'borderColor: theme.colors.cardBorder');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
  }
});
console.log('Fixed more colors in ' + fixedCount + ' files');
