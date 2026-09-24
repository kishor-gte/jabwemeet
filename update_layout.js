const fs = require('fs');
let code = fs.readFileSync('frontend/app/layout.tsx', 'utf8');

if (!code.includes('ToastProvider')) {
  code = code.replace(
    'import FloatingBackButton from "@/components/FloatingBackButton";',
    'import FloatingBackButton from "@/components/FloatingBackButton";\nimport ToastProvider from "@/components/ToastProvider";'
  );
  code = code.replace(
    '<body className="min-h-full flex flex-col">',
    '<body className="min-h-full flex flex-col">\n        <ToastProvider>'
  );
  code = code.replace(
    '</body>',
    '</ToastProvider>\n      </body>'
  );
  fs.writeFileSync('frontend/app/layout.tsx', code);
}
