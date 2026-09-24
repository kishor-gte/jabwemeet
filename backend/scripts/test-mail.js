const { sendNewConnectionRequestEmail, sendRequestClaimedByOtherEmail } = require("../utils/mailer");
const prisma = require("../db");

async function testMailer() {
  console.log("Testing email sending for Breakup Buddies...");
  const buddies = await prisma.user.findMany({
    where: { role: "BREAKUP_BUDDY" },
    select: { id: true, name: true, email: true, displayName: true }
  });

  console.log("Found breakup buddies:", buddies);

  for (const b of buddies) {
    if (b.email) {
      console.log(`Sending test request email to ${b.email}...`);
      await sendNewConnectionRequestEmail({
        buddyEmail: b.email,
        buddyName: b.displayName || b.name,
        userName: "Test Member",
        topic: "Emotional healing & guidance",
        sessionFormat: "Chat & Call",
      });

      console.log(`Sending test claimed email to ${b.email}...`);
      await sendRequestClaimedByOtherEmail({
        buddyEmail: b.email,
        buddyName: b.displayName || b.name,
        userName: "Test Member",
      });
    }
  }
  console.log("Finished mail test.");
}

testMailer()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
