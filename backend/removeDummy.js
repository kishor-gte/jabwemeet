const prisma = require('./db');

async function removeDummy() {
  try {
    const deleted = await prisma.matchmakingRequest.deleteMany({
      where: {
        client: {
          email: {
            in: ['arjun@example.com', 'meera@example.com']
          }
        }
      }
    });
    console.log(`Successfully removed ${deleted.count} dummy requests.`);
  } catch (error) {
    console.error('Error removing dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDummy();
