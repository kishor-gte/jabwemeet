const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

code = code.replace(
  /res\.json\(\{ success: true, data: profile \}\);/g,
  'res.json({ success: true, data: { ...profile, email: user ? user.email : "" } });'
);

fs.writeFileSync('backend/routes/cafe.js', code);
