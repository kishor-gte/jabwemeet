const fs = require('fs');
let code = fs.readFileSync('frontend/app/dashboard/page.tsx', 'utf8');

// Fix type quotes
code = code.replace(/\\'success\\'/g, "'success'");
code = code.replace(/\\'error\\'/g, "'error'");

// Fix the bad setTimeout
code = code.replace(/setTimeout\(\(\) => setToast\(\{ text: null\), 4500, type: 'success' \}\);/g, 'setTimeout(() => setToast(null), 4500);');
code = code.replace(/setTimeout\(\(\) => setToast\(\{ text: null\), 4000, type: 'success' \}\);/g, 'setTimeout(() => setToast(null), 4000);');

// Fix newline escape
code = code.replace(/\\n/g, '\n');

fs.writeFileSync('frontend/app/dashboard/page.tsx', code);
console.log('Fixed dashboard.');
