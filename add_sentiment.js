const prisma = require('./backend/db');
async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DateFeedback" ADD COLUMN IF NOT EXISTS "sentiment" TEXT DEFAULT 'NEUTRAL'
    `);
    console.log('Added sentiment column');
  } catch (e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
run();
