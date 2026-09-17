const prisma = require('./backend/db');
async function run() {
  await prisma.$executeRawUnsafe(`
    UPDATE "ServicePackage"
    SET "type" = 'DATING'
    WHERE "name" ILIKE '%dating%' OR "name" ILIKE '%date%' OR "name" ILIKE '%package%'
  `);
  console.log('Updated packages to DATING');
}
run().catch(console.error).finally(() => prisma.$disconnect());
