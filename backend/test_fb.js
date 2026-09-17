const prisma = require('./db');
async function test() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DateFeedback" (
        "id" TEXT NOT NULL,
        "matchId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "gender" TEXT,
        "rating" INTEGER NOT NULL,
        "feedback" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DateFeedback_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Table created or exists');
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "DateFeedback" ("id", "matchId", "userId", "gender", "rating", "feedback")
      VALUES ($1, $2, $3, $4, $5, $6)
    `, 'FB-1234', 'testMatch', 'testUser', 'Male', 5, 'Great date');
    console.log('Inserted');
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
test();
