const fs = require('fs');
let code = fs.readFileSync('frontend/components/FloatingBackButton.tsx', 'utf8');

code = code.replace(
  'className="fixed bottom-6 left-6 z-[99999]',
  'className="fixed top-6 left-6 z-[99999]'
);

fs.writeFileSync('frontend/components/FloatingBackButton.tsx', code);
