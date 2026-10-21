require('dotenv').config();
const prisma = require('../db');

async function migrate() {
  console.log('Applying profile visibility columns to User table...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileVisibility" VARCHAR(50) DEFAULT 'all_members';
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "allowRmMatchmaking" BOOLEAN DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "showAgePublicly" BOOLEAN DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "showHometownPublicly" BOOLEAN DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cityVisibility" BOOLEAN DEFAULT true;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hometown" VARCHAR(100);
  `);

  // Ensure existing rows have defaults populated
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "profileVisibility" = 'all_members'
    WHERE "profileVisibility" IS NULL;
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "allowRmMatchmaking" = true
    WHERE "allowRmMatchmaking" IS NULL;
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "showAgePublicly" = true
    WHERE "showAgePublicly" IS NULL;
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "showHometownPublicly" = true
    WHERE "showHometownPublicly" IS NULL;
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET "cityVisibility" = true
    WHERE "cityVisibility" IS NULL;
  `);

  console.log('Profile visibility columns migrated successfully.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
