const prisma = require("../db");

async function main() {
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isApproved: true }
  });
  console.log("All users in DB:", JSON.stringify(allUsers, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
