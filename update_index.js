const fs = require('fs');
let content = fs.readFileSync('backend/index.js', 'utf8');
content = content.replace(
  \"app.use('/api/matchmaker', matchmakerRouter);\",
  \"app.use('/api/matchmaker', matchmakerRouter);\\napp.use('/api/buddy', require('./routes/buddy'));\"
);
fs.writeFileSync('backend/index.js', content, 'utf8');
