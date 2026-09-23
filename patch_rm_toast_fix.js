const fs = require('fs');
const file = 'frontend/app/relationship-manager/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\\'success\\\'/g, "'success'");
content = content.replace(/\\\'error\\\'/g, "'error'");
content = content.replace(/\\\\n/g, '\n');

fs.writeFileSync(file, content);
console.log('Fixed quotes.');
