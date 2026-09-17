const fs = require('fs');
let content = fs.readFileSync('backend/routes/services.js', 'utf8');

const reviewCode = `
// 13. POST /api/services/buddy-review
// Submit a review for a Breakup Buddy
router.post('/buddy-review', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { buddyId, rating, comment } = req.body;

    if (!buddyId || !rating) {
      return res.status(400).json({ success: false, message: 'Buddy ID and rating are required.' });
    }

    const review = await prisma.buddyReview.create({
      data: {
        userId,
        buddyId,
        rating: parseInt(rating),
        comment: comment || '',
      }
    });

    return res.json({ success: true, data: review });
  } catch (error) {
    console.error('Error creating buddy review:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

module.exports = router;
`;
content = content.replace('module.exports = router;', reviewCode);

const oldStr = `    await prisma.buddyPresence.upsert({
      where: { requestId_role: { requestId, role: 'USER' } },
      update: { lastSeen: new Date() },
      create: { requestId, role: 'USER', lastSeen: new Date() },
    });

    const buddyPresence = await prisma.buddyPresence.findUnique({
      where: { requestId_role: { requestId, role: 'BUDDY' } },
    });
    const threshold = new Date(Date.now() - 15000); // 15s threshold
    const buddyActive = buddyPresence && buddyPresence.lastSeen > threshold;

    if (buddyActive && request.timeUsedSeconds < request.chatLimitSeconds) {
      request = await prisma.buddyRequest.update({
        where: { id: requestId },
        data: { timeUsedSeconds: { increment: 5 } }
      });
    }`;

const newStr = `    const oldPresence = await prisma.buddyPresence.findUnique({
      where: { requestId_role: { requestId, role: 'USER' } }
    });

    await prisma.buddyPresence.upsert({
      where: { requestId_role: { requestId, role: 'USER' } },
      update: { lastSeen: new Date() },
      create: { requestId, role: 'USER', lastSeen: new Date() },
    });

    const buddyPresence = await prisma.buddyPresence.findUnique({
      where: { requestId_role: { requestId, role: 'BUDDY' } },
    });
    const threshold = new Date(Date.now() - 15000); // 15s threshold
    const buddyActive = buddyPresence && buddyPresence.lastSeen > threshold;

    if (buddyActive && request.timeUsedSeconds < request.chatLimitSeconds) {
      request = await prisma.buddyRequest.update({
        where: { id: requestId },
        data: { timeUsedSeconds: { increment: 5 } }
      });
    }

    const twoMinsAgo = new Date(Date.now() - 120000);
    const userJustEntered = !oldPresence || oldPresence.lastSeen < twoMinsAgo;

    if (userJustEntered) {
      const io = req.app.get('io');
      if (io && request.buddyId) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        const uName = user ? user.name : 'User';
        io.to(\`buddy-\${request.buddyId}\`).emit('user-entered-chat', {
          requestId,
          userId,
          userName: uName,
          message: \`Hey, your user \${uName} is in chat! Go and talk with them.\`
        });
      }
    }`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('backend/routes/services.js', content);
console.log('Success');
