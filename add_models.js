const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
if (!schema.includes('cafeProfile CafeProfile?')) {
    schema = schema.replace(/role\s+Role\s+@default\(USER\)/, 'role               Role      @default(USER)\n  cafeProfile        CafeProfile?');
}
const cafeModels = `
model CafeProfile {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  cafeName       String
  description    String?
  phone          String?
  address        String?
  city           String?
  pincode        String?
  openingTime    String?
  closingTime    String?
  fssaiNumber    String?
  gstNumber      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  menuItems      MenuItem[]
  reservations   CafeReservation[]
  orders         CafeOrder[]
  staff          CafeStaff[]
  offers         CafeOffer[]
}
model MenuItem {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  name           String
  category       String
  description    String?
  price          Float
  discount       Float    @default(0)
  isVeg          Boolean  @default(true)
  prepTime       String?
  isAvailable    Boolean  @default(true)
  createdAt      DateTime @default(now())
}
model CafeReservation {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  customerName   String
  guests         Int
  date           String
  time           String
  table          String?
  status         String   @default("Pending")
  createdAt      DateTime @default(now())
}
model CafeOrder {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  customerName   String?
  totalAmount    Float
  status         String   @default("New")
  items          CafeOrderItem[]
  createdAt      DateTime @default(now())
}
model CafeOrderItem {
  id             String   @id @default(cuid())
  orderId        String
  order          CafeOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  itemName       String
  quantity       Int
  price          Float
}
model CafeStaff {
  id             String   @id @default(cuid())
  cafeId         String
  cafe           CafeProfile @relation(fields: [cafeId], references: [id])
  name           String
  role           String
  status         String   @default("Active")
}
model CafeOffer {
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
}
`;
if (!schema.includes('model CafeProfile')) {
    schema += '\n' + cafeModels;
}
fs.writeFileSync('backend/prisma/schema.prisma', schema);
