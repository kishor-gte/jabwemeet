const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

// Fix middleware import
code = code.replace(
  "const { auth } = require('../middleware/auth');",
  "const { authenticateToken } = require('../middleware/auth');"
);
// Fix route usage
code = code.replace(
  "router.use(auth, isCafe);",
  "router.use(authenticateToken, isCafe);"
);

fs.writeFileSync('backend/routes/cafe.js', code);
