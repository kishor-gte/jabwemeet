const fs = require('fs');
let index = fs.readFileSync('backend/index.js', 'utf8');
if (!index.includes('/api/cafe')) {
    index = index.replace(/(app\.use\('\/api\/admin', adminRouter\);)/, "$1\nconst cafeRouter = require('./routes/cafe');\napp.use('/api/cafe', cafeRouter);");
    fs.writeFileSync('backend/index.js', index);
}
