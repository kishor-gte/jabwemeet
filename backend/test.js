
const prisma = require('./db');
async function main() {
    const userId = 'cmu551mio0002k4v3xc2pzuwx';
    const unreadMessages = await prisma.connectionMessage.findMany({
      where: {
        suggestion: {
          OR: [
            { clientId: userId },
            { suggestedProfileId: userId }
          ]
        },
        senderId: { not: userId },
        isRead: false
      },
      select: {
        suggestionId: true,
        sender: { select: { name: true } }
      }
    });

    const unreadByConnection = {};
    unreadMessages.forEach(m => {
      unreadByConnection[m.suggestionId] = (unreadByConnection[m.suggestionId] || 0) + 1;
    });

    console.log({ 
      success: true, 
      count: unreadMessages.length,
      unreadByConnection,
      senders: [...new Set(unreadMessages.map(m => m.sender.name))]
    });
}
main().catch(console.error).finally(() => prisma['$disconnect']());

