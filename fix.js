const fs = require('fs');
let content = fs.readFileSync('backend/routes/services.js', 'utf8');

const reviewCode = 
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
;

content = content.replace('module.exports = router;', reviewCode);

let presenceStart = content.indexOf('router.post("/buddy-presence/:requestId"');
let presenceEnd = content.indexOf('router.get("/buddy-presence/:requestId"');
let presenceBody = content.substring(presenceStart, presenceEnd);

let newPresenceBody = presenceBody.replace(
    'await prisma.buddyPresence.upsert({',
    'const oldPresence = await prisma.buddyPresence.findUnique({ where: { requestId_role: { requestId, role: \\'USER\\' } } });\\n\\n    await prisma.buddyPresence.upsert({'
);

newPresenceBody = newPresenceBody.replace(
    'const io = req.app.get(\\'io\\');',
    'const twoMinsAgo = new Date(Date.now() - 120000);\\n    const userJustEntered = !oldPresence || oldPresence.lastSeen < twoMinsAgo;\\n\\n    if (userJustEntered) {\\n      const io = req.app.get(\\'io\\');'
);

newPresenceBody = newPresenceBody.replace(
    'message: \\Hey, your user \\ is in chat! Go and talk with them.\\\\n      });\\n    }',
    'message: \\Hey, your user \\ is in chat! Go and talk with them.\\\\n      });\\n    }\\n    }'
);

content = content.substring(0, presenceStart) + newPresenceBody + content.substring(presenceEnd);

fs.writeFileSync('backend/routes/services.js', content);
