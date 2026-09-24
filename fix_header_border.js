const fs = require('fs');
let code = fs.readFileSync('frontend/components/cafe/CafeHeader.tsx', 'utf8');

code = code.replace('gap-3 border-r border-white/10 pr-6"', 'gap-3"');

fs.writeFileSync('frontend/components/cafe/CafeHeader.tsx', code);
