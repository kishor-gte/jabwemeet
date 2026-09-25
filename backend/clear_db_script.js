const prisma = require('./db');

async function clearDatabase() {
  console.log("Starting database cleanup...");
  
  try {
    // Identify users to keep (Admins and Cafe Partners)
    const usersToKeep = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'CAFE'] }
      },
      select: { id: true, email: true, role: true }
    });
    const keepIds = usersToKeep.map(u => u.id);

    console.log(`Found ${keepIds.length} Admin/Cafe users to keep.`);
    usersToKeep.forEach(u => console.log(` - Keeping: ${u.email} (${u.role})`));

    // Delete dependent feature records to prevent Foreign Key constraint errors
    console.log("\nClearing Matchmaking & Relationship Manager data...");
    await prisma.connectionMessage.deleteMany({});
    await prisma.matchSuggestion.deleteMany({});
    await prisma.matchmakingRequest.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    
    console.log("Clearing Breakup Buddy data...");
    await prisma.callLog.deleteMany({});
    await prisma.buddyMessage.deleteMany({});
    await prisma.buddyPresence.deleteMany({});
    await prisma.buddyRequest.deleteMany({});
    await prisma.buddySession.deleteMany({});
    await prisma.buddyReview.deleteMany({});
    
    console.log("Clearing Events & Bookings data...");
    await prisma.eventBooking.deleteMany({});
    await prisma.event.deleteMany({});
    
    console.log("Clearing Host Subscriptions data...");
    await prisma.hostSubscription.deleteMany({});
    await prisma.hostPayment.deleteMany({});
    
    console.log("Clearing Utilities data...");
    await prisma.passwordReset.deleteMany({});

    // Finally, delete all users except Admins and Cafes
    console.log("\nDeleting all other users...");
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { notIn: keepIds }
      }
    });

    console.log(`\nSuccess! Deleted ${deletedUsers.count} users.`);
    console.log("Database cleared successfully. Cafe and Admin credentials remain.");

  } catch (error) {
    console.error("Error during database cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
