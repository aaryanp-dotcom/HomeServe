const fs = require('fs');
const content = fs.readFileSync('src/lib/themes/data.ts', 'utf8');

const matches = content.match(/slug:\s*['"][^'"]+['"]/g) || [];
console.log('Total theme slugs matched:', matches.length);

const { THEMES } = require('./src/lib/themes/data.ts');
console.log('THEMES array length:', THEMES ? THEMES.length : 'undefined (needs compilation)');
