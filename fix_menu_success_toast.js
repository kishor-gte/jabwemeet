const fs = require('fs');
let code = fs.readFileSync('frontend/app/cafe/menu/page.tsx', 'utf8');

code = code.replace(
  'fetchMenu();\n        setFormData',
  'fetchMenu();\n        showToast("Item saved successfully!", "success");\n        setFormData'
);

fs.writeFileSync('frontend/app/cafe/menu/page.tsx', code);
