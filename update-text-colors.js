const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/**/*.tsx');

files.forEach(file => {
  if (file === 'app/index.tsx') return;
  
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Find styles that look like text styles but don't have color
  const styleBlockRegex = /([a-zA-Z0-9_]+):\s*{([^}]*)}/g;
  
  content = content.replace(styleBlockRegex, (match, className, body) => {
    // If it has fontSize, fontWeight, or is named 'title', 'label', 'text', 'name'
    if (
      (body.includes('fontSize') || body.includes('fontWeight') || 
       className.toLowerCase().includes('title') || 
       className.toLowerCase().includes('text') || 
       className.toLowerCase().includes('label') ||
       className.toLowerCase().includes('name') ||
       className.toLowerCase().includes('balance') ||
       className.toLowerCase().includes('amount') ||
       className.toLowerCase().includes('date') ||
       className.toLowerCase().includes('description') ||
       className.toLowerCase().includes('input')) &&
      !body.includes('color:') &&
      !body.includes('backgroundColor:') // sometimes buttons are named text but have backgroundColor, though we want color
    ) {
      changed = true;
      return `${className}: {${body}    color: theme.colors.text,\n  }`;
    }
    
    // Add color: theme.colors.text if it only had a background color change and it's missing color but looks like text
    if (className.toLowerCase().includes('input') && !body.includes('color:')) {
      changed = true;
      return `${className}: {${body}    color: theme.colors.text,\n  }`;
    }

    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated text colors in ' + file);
  }
});
