const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

schema = schema.replace(
  'gstNumber      String?',
  'gstNumber      String?\n    bankName       String?\n    bankAccount    String?\n    bankIfsc       String?\n    currency       String   @default("INR")\n    timezone       String   @default("Asia/Kolkata")'
);

fs.writeFileSync('backend/prisma/schema.prisma', schema);
