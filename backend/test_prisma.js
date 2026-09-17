const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const buddies = await prisma.user.findMany({
      where: {
        role: "BREAKUP_BUDDY",
        isApproved: true,
      },
      select: {
        id: true,
        weeklySchedule: true,
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(buddies);
  } catch(e) {
    console.error(e);
  }
}
main();
