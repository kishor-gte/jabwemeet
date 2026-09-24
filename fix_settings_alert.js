const fs = require('fs');
let code = fs.readFileSync('frontend/app/cafe/settings/page.tsx', 'utf8');

code = code.replace(
  'alert("Failed to update: " + data.message);',
  'alert("Failed to update: " + (data.error || data.message || "Unknown error"));'
);

fs.writeFileSync('frontend/app/cafe/settings/page.tsx', code);
