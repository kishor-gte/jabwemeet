const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const newModels = `
model CafeCustomer {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  name           String
  contact        String?
  visits         Int      @default(1)
  totalSpent     Float    @default(0)
  lastVisit      DateTime @default(now())
  createdAt      DateTime @default(now())
}

model CafeReview {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  customerName   String
  rating         Int
  text           String?
  reply          String?
  isReplied      Boolean  @default(false)
  createdAt      DateTime @default(now())
}

model CafeTransaction {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  orderId        String?
  customerName   String?
  amount         Float
  method         String   @default("Cash") // UPI, Card, Cash
  status         String   @default("Completed") // Completed, Pending
  createdAt      DateTime @default(now())
}

model CafeNotification {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  message        String
  isRead         Boolean  @default(false)
  createdAt      DateTime @default(now())
}
`;

// Also need to add these to CafeProfile relation
let profileDef = schema.match(/model CafeProfile \{[^}]+\}/)[0];
if (!profileDef.includes('customers      CafeCustomer[]')) {
  let updatedProfileDef = profileDef.replace('}', '  customers      CafeCustomer[]\n  reviews        CafeReview[]\n  transactions   CafeTransaction[]\n  notifications  CafeNotification[]\n}');
  schema = schema.replace(profileDef, updatedProfileDef);
  schema += '\n' + newModels;
  fs.writeFileSync('backend/prisma/schema.prisma', schema);
}
