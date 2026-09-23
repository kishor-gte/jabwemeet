const prisma = require('./db.js');

async function clearUsers() {
  try {
    console.log("Clearing all users from the database...");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE;`);
    console.log("✅ All users and related data have been cleared successfully.");
  } catch (e) {
    console.error("Error clearing users:", e);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();
