const fs = require('fs');
const code = fs.readFileSync('src/app/results/page.js', 'utf8');

try {
  require('@babel/core').transformSync(code, {
    presets: ['@babel/preset-react']
  });
  console.log('Syntax OK');
} catch (e) {
  console.error(e.message);
}
