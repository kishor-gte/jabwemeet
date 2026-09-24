const fs = require('fs');
let code = fs.readFileSync('frontend/components/ToastProvider.tsx', 'utf8');

code = code.replace(
  'className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"',
  'className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-3 pointer-events-none"'
);

fs.writeFileSync('frontend/components/ToastProvider.tsx', code);
