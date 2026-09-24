const prisma = require("../db");

async function main() {
  const m = await prisma.buddyMessage.deleteMany({});
  console.log("Deleted buddy messages:", m.count);

  const p = await prisma.buddyPresence.deleteMany({});
  console.log("Deleted buddy presences:", p.count);

  const c = await prisma.callLog.deleteMany({});
  console.log("Deleted call logs:", c.count);

  const s = await prisma.buddySession.deleteMany({});
  console.log("Deleted buddy sessions:", s.count);

  const r = await prisma.buddyRequest.deleteMany({});
  console.log("Deleted buddy requests:", r.count);

  console.log("SUCCESS: All existing Breakup Buddy connections and test data have been cleared.");
}

main()
  .catch((e) => {
    console.error("Error clearing connections:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
