const prisma = require('./backend/db');
async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DateFeedback" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT FALSE
    `);
    console.log('Added isPublished column');
  } catch (e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
run();
