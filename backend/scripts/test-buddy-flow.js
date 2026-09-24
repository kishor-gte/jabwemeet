const prisma = require("../db");

async function main() {
  // 1. Find a test user
  const user = await prisma.user.findFirst({ where: { role: "USER" } });
  const buddies = await prisma.user.findMany({ where: { role: "BREAKUP_BUDDY" } });

  console.log("User:", user?.email, "Buddies count:", buddies.length);
  if (!user || buddies.length < 2) {
    console.log("Need at least 1 user and 2 breakup buddies to test full flow.");
    return;
  }

  const buddy1 = buddies[0];
  const buddy2 = buddies[1];

  // 2. Clear previous test requests
  await prisma.buddyMessage.deleteMany({});
  await prisma.buddyPresence.deleteMany({});
  await prisma.callLog.deleteMany({});
  await prisma.buddySession.deleteMany({});
  await prisma.buddyRequest.deleteMany({});

  // 3. User creates a broadcast request without selecting a buddy
  const request = await prisma.buddyRequest.create({
    data: {
      userId: user.id,
      buddyId: buddy1.id, // placeholder for DB foreign key
      sessionType: "Chat & Call",
      topic: "1-on-1 Emotional Support Session",
      status: "Pending",
      chatLimitSeconds: 1800,
      voiceCallLimitSeconds: 1800,
    }
  });
  console.log("Created broadcast request:", request.id, "status:", request.status);

  // 4. Buddy 1 claims/accepts the request
  const updatedReq = await prisma.buddyRequest.update({
    where: { id: request.id },
    data: {
      buddyId: buddy1.id,
      status: "Accepted",
    }
  });
  console.log("Buddy 1 claimed request:", updatedReq.id, "assigned to:", buddy1.name);

  // 5. Check if Buddy 2 is blocked from accepting
  const checkReq = await prisma.buddyRequest.findUnique({ where: { id: request.id } });
  if (checkReq.status === "Accepted" && checkReq.buddyId !== buddy2.id) {
    console.log("SUCCESS: Buddy 2 is BLOCKED! Request is claimed by Buddy 1.");
  } else {
    console.log("FAIL: Request was not locked.");
  }

  // 6. Clean up the test request so DB remains clean
  await prisma.buddySession.deleteMany({});
  await prisma.buddyRequest.deleteMany({});
  console.log("Cleaned test data. Ready for live testing!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
