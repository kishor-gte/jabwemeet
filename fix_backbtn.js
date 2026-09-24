const fs = require('fs');
let code = fs.readFileSync('frontend/components/FloatingBackButton.tsx', 'utf8');

code = code.replace(
  'className="fixed top-28 right-8 z-[40]',
  'className="fixed top-[22px] right-8 z-[50]'
);

fs.writeFileSync('frontend/components/FloatingBackButton.tsx', code);
