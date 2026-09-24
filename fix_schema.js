const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

schema = schema.replace(
  /status         String   @default\("Active"\)\r?\n  \}/g,
  'status         String   @default("Active")\n    createdAt      DateTime @default(now())\n  }'
);

fs.writeFileSync('backend/prisma/schema.prisma', schema);
