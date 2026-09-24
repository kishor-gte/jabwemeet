const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const oldOffer = `model CafeOffer {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  name           String
  code           String
  type           String
  value          String
  minOrder       Int?
  startDate      String?
  endDate        String?
  status         String   @default("Active")
}`;

const newOffer = `model CafeOffer {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  name           String
  code           String
  type           String
  value          String
  minOrder       Int?
  startDate      String?
  endDate        String?
  status         String   @default("Active")
  createdAt      DateTime @default(now())
}`;

schema = schema.replace(oldOffer, newOffer);
// For safety if line endings differ
const regex = /model CafeOffer \{[\s\S]*?status\s+String\s+@default\("Active"\)\r?\n\}/;
schema = schema.replace(regex, newOffer);

fs.writeFileSync('backend/prisma/schema.prisma', schema);
