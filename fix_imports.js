const fs = require('fs');

function addImport(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('@/components/ToastProvider')) {
    code = code.replace('"use client";', '"use client";\nimport { useToast } from "@/components/ToastProvider";');
    fs.writeFileSync(file, code);
  }
}

addImport('frontend/app/cafe/offers/page.tsx');
addImport('frontend/app/cafe/profile/page.tsx');
