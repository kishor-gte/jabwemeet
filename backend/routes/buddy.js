const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendSessionScheduledEmail } = require('../utils/mailer');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['BREAKUP_BUDDY']));

router.get('/dashboard', async (req, res) => {
  try {
    const buddyId = req.user.userId;
    const newRequests = await prisma.buddyRequest.count({ where: { buddyId, status: 'Pending' } });
    const upcomingSessions = await prisma.buddySession.count({ where: { buddyId, status: 'Scheduled' } });
    const completedSessions = await prisma.buddySession.count({ where: { buddyId, status: 'Completed' } });
    
    // Calculate total earnings across all completed sessions & subscriptions
    const completedList = await prisma.buddySession.findMany({
      where: { buddyId, status: 'Completed' },
      select: { amountEarned: true }
    });
    const totalEarnings = completedList.reduce((acc, curr) => acc + (curr.amountEarned || 0), 0);

    res.json({
      success: true,
      data: {
        newRequests,
        upcomingSessions,
        completedSessions,
        totalEarnings,
      }
    });
  } catch (error) {
    console.error("Buddy dashboard error:", error);
    res.status(500).json({ success: false });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const requests = await prisma.buddyRequest.findMany({
      where: { buddyId: req.user.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            gender: true,
            profileImage: true,
            dateOfBirth: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/accepted-users', async (req, res) => {
  try {
    const accepted = await prisma.buddyRequest.findMany({
      where: {
        buddyId: req.user.userId,
        status: 'Accepted',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            gender: true,
            profileImage: true,
            dateOfBirth: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, data: accepted });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await prisma.buddySession.findMany({
      where: { buddyId: req.user.userId, status: 'Scheduled' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            gender: true,
            profileImage: true,
            dateOfBirth: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await prisma.buddySession.findMany({
      where: { buddyId: req.user.userId, status: 'Completed' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            gender: true,
            profileImage: true,
            dateOfBirth: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    const formatted = history.map(item => {
      const startTime = item.scheduledAt || item.createdAt || new Date();
      const durMinutes = item.durationMinutes || 60;
      const completedTime = item.updatedAt && new Date(item.updatedAt).getTime() > new Date(startTime).getTime()
        ? item.updatedAt
        : new Date(new Date(startTime).getTime() + durMinutes * 60 * 1000);

      return {
        ...item,
        startedAt: startTime,
        completedAt: completedTime,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Buddy history error:", error);
    res.status(500).json({ success: false });
  }
});

router.get('/reviews', async (req, res) => {
  try {
    const reviews = await prisma.buddyReview.findMany({
      where: { buddyId: req.user.userId },
      include: { user: { select: { name: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const userId = req.user?.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { buddyId, rating, comment } = req.body;
    if (!buddyId || !rating) {
      return res.status(400).json({ success: false, message: 'Buddy ID and rating are required' });
    }
    const numRating = parseInt(rating, 10);
    const review = await prisma.buddyReview.create({
      data: {
        userId,
        buddyId,
        rating: Math.min(5, Math.max(1, numRating)),
        comment: comment ? String(comment).trim() : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        buddy: { select: { id: true, name: true, displayName: true } },
      },
    });
    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Error in POST /api/buddy/reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/earnings', async (req, res) => {
  try {
    const buddyId = req.user.userId;
    const sessions = await prisma.buddySession.findMany({
      where: { buddyId, status: 'Completed' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            profileImage: true,
          }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });
    let totalEarnings = 0;
    sessions.forEach(s => totalEarnings += (s.amountEarned || 0));
    res.json({ success: true, data: { totalEarnings, sessions } });
  } catch (error) {
    console.error("Buddy earnings error:", error);
    res.status(500).json({ success: false });
  }
});

// Update request status (Accept or Reject)
router.patch('/requests/:id', async (req, res) => {
  try {
    const buddyId = req.user.userId;
    const { id } = req.params;
    const { status, scheduledAt, durationMinutes } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Accepted or Rejected.' });
    }

    const request = await prisma.buddyRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.buddyId !== buddyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this request' });
    }

    const updatedRequest = await prisma.buddyRequest.update({
      where: { id },
      data: { status },
      include: { user: { select: { name: true, profileImage: true } } },
    });

    let session = null;
    if (status === 'Accepted') {
      session = await prisma.buddySession.create({
        data: {
          userId: request.userId,
          buddyId: buddyId,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
          durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 45,
          sessionType: request.sessionType || '1-on-1 Call',
          status: 'Scheduled',
          amountEarned: 499.0,
        },
      });

      // Send Session Confirmation Email to user
      try {
        const buddyUser = await prisma.user.findUnique({ where: { id: buddyId }, select: { name: true, displayName: true } });
        if (request.user?.email) {
          sendSessionScheduledEmail({
            userEmail: request.user.email,
            userName: request.user.name,
            buddyName: buddyUser?.displayName || buddyUser?.name || 'Breakup Buddy',
            scheduledAt: session.scheduledAt,
            durationMinutes: session.durationMinutes,
            sessionType: session.sessionType,
          }).catch(e => {});
        }
      } catch (mailErr) {
        console.warn('Buddy session mail note:', mailErr.message);
      }
    }

    return res.json({
      success: true,
      message: status === 'Accepted' ? 'Request accepted and session scheduled!' : 'Request rejected.',
      data: updatedRequest,
      session,
    });
  } catch (error) {
    console.error('Error updating buddy request:', error);
    return res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

// POST /api/buddy/requests/:id/accept
router.post('/requests/:id/accept', async (req, res) => {
  try {
    const buddyId = req.user.userId;
    const { id } = req.params;
    const { scheduledAt, durationMinutes } = req.body;

    const request = await prisma.buddyRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.buddyId !== buddyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this request' });
    }

    const updatedRequest = await prisma.buddyRequest.update({
      where: { id },
      data: { status: 'Accepted' },
      include: { user: { select: { name: true, profileImage: true, email: true } } },
    });

    const session = await prisma.buddySession.create({
      data: {
        userId: request.userId,
        buddyId: buddyId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 45,
        sessionType: request.sessionType || '1-on-1 Call',
        status: 'Scheduled',
        amountEarned: 499.0,
      },
    });

    // Send Session Confirmation Email to user
    try {
      const buddyUser = await prisma.user.findUnique({ where: { id: buddyId }, select: { name: true, displayName: true } });
      if (request.user?.email) {
        sendSessionScheduledEmail({
          userEmail: request.user.email,
          userName: request.user.name,
          buddyName: buddyUser?.displayName || buddyUser?.name || 'Breakup Buddy',
          scheduledAt: session.scheduledAt,
          durationMinutes: session.durationMinutes,
          sessionType: session.sessionType,
        }).catch(e => {});
      }
    } catch (mailErr) {
      console.warn('Buddy accept mail note:', mailErr.message);
    }

    return res.json({
      success: true,
      message: 'Request accepted and session scheduled successfully',
      data: updatedRequest,
      session,
    });
  } catch (error) {
    console.error('Error accepting buddy request:', error);
    return res.status(500).json({ success: false, message: 'Failed to accept request' });
  }
});

// POST /api/buddy/requests/:id/reject
router.post('/requests/:id/reject', async (req, res) => {
  try {
    const buddyId = req.user.userId;
    const { id } = req.params;

    const request = await prisma.buddyRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.buddyId !== buddyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this request' });
    }

    const updatedRequest = await prisma.buddyRequest.update({
      where: { id },
      data: { status: 'Rejected' },
      include: { user: { select: { name: true, profileImage: true } } },
    });

    return res.json({
      success: true,
      message: 'Request rejected successfully',
      data: updatedRequest,
    });
  } catch (error) {
    console.error('Error rejecting buddy request:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
});

// PATCH /api/buddy/sessions/:id/complete
router.patch('/sessions/:id/complete', async (req, res) => {
  try {
    const buddyId = req.user.userId;
    const { id } = req.params;

    const session = await prisma.buddySession.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.buddyId !== buddyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updatedSession = await prisma.buddySession.update({
      where: { id },
      data: {
        status: 'Completed',
        amountEarned: session.amountEarned > 0 ? session.amountEarned : 499.0,
      },
    });

    return res.json({
      success: true,
      message: 'Session marked as completed! Earnings updated.',
      data: updatedSession,
    });
  } catch (error) {
    console.error('Error completing session:', error);
    return res.status(500).json({ success: false, message: 'Failed to complete session' });
  }
});

// ─── CHAT MESSAGES ───────────────────────────────────────────────────────────

// GET /api/buddy/chat/:requestId — fetch messages
router.get('/chat/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const buddyId = req.user.userId;

    const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
    if (!request || request.buddyId !== buddyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const messages = await prisma.buddyMessage.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: messages, timeUsedSeconds: request.timeUsedSeconds });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// POST /api/buddy/away/:requestId — explicitly mark as away to instantly pause timer
router.post('/away/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const buddyId = req.user.userId;

    await prisma.buddyPresence.updateMany({
      where: { requestId, role: 'BUDDY' },
      data: { lastSeen: new Date(Date.now() - 60000) } // Set to 1 min ago
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// POST /api/buddy/chat/:requestId — send a message (buddy side)
router.post('/chat/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { text } = req.body;
    const buddyId = req.user.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text required' });
    }

    const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
    if (!request || request.buddyId !== buddyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const message = await prisma.buddyMessage.create({
      data: {
        requestId,
        senderId: buddyId,
        senderRole: 'BUDDY',
        text: text.trim(),
      },
    });

    // Email notification if receiver is not active
    try {
      const io = req.app.get('io');
      const receiverId = request.userId;
      const receiverSockets = io ? await io.in(`user-${receiverId}`).fetchSockets() : [];
      const isOnline = receiverSockets.length > 0;

      if (!isOnline) {
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (receiver && receiver.email) {
          const { sendMail } = require('../services/emailService');
          const subject = `📬 New Message from your Buddy ${req.user.name || 'someone'}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #FF4081;">💌 You've got a new message!</h2>
              <p>Hi ${receiver.name},</p>
              <p>You have an unread message waiting for you on JabWeMeet from your Breakup Buddy.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF4081;">
                <p><em>"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"</em></p>
              </div>
              <p>Since you weren't active, we thought we'd let you know. Log in now to reply and keep the conversation going! ✨</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?tab=messages" style="display: inline-block; padding: 10px 20px; background-color: #FF4081; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Go to Messages 🚀</a>
              <br/><br/>
              <p>Cheers, <br/>The JabWeMeet Team 💖</p>
            </div>
          `;
          sendMail(receiver.email, subject, '', html).catch(err => console.error('Email send failed', err));
        }
      }
    } catch (notifyErr) {
      console.error('Error notifying offline user:', notifyErr);
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// POST /api/buddy/presence/:requestId — heartbeat (buddy side)
router.post('/presence/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const buddyId = req.user.userId;

    let request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
    if (!request || request.buddyId !== buddyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.buddyPresence.upsert({
      where: { requestId_role: { requestId, role: 'BUDDY' } },
      update: { lastSeen: new Date() },
      create: { requestId, role: 'BUDDY', lastSeen: new Date() },
    });

    const userPresence = await prisma.buddyPresence.findUnique({
      where: { requestId_role: { requestId, role: 'USER' } },
    });
    const threshold = new Date(Date.now() - 15000); // 15 seconds threshold for away
    const userActive = userPresence && userPresence.lastSeen > threshold;

    res.json({ success: true, data: { bothActive: !!userActive, timeUsedSeconds: request.timeUsedSeconds } });
  } catch (error) {
    console.error('Presence error:', error);
    res.status(500).json({ success: false });
  }
});

// GET /api/buddy/presence/:requestId — check presence (buddy side)
router.get('/presence/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const buddyId = req.user.userId;

    const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
    if (!request || request.buddyId !== buddyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const threshold = new Date(Date.now() - 30000);
    const [userPresence, buddyPresence] = await Promise.all([
      prisma.buddyPresence.findUnique({ where: { requestId_role: { requestId, role: 'USER' } } }),
      prisma.buddyPresence.findUnique({ where: { requestId_role: { requestId, role: 'BUDDY' } } }),
    ]);

    const userActive = userPresence && userPresence.lastSeen > threshold;
    const buddyActive = buddyPresence && buddyPresence.lastSeen > threshold;

    res.json({ success: true, data: { userActive: !!userActive, buddyActive: !!buddyActive, bothActive: !!(userActive && buddyActive) } });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// GET /api/buddy/call-logs — fetch call log history for Breakup Buddy
router.get('/call-logs', async (req, res) => {
  try {
    const buddyId = req.user.userId;
    const logs = await prisma.callLog.findMany({
      where: {
        OR: [
          { callerId: buddyId },
          { receiverId: buddyId }
        ]
      },
      include: {
        caller: {
          select: { id: true, name: true, email: true, phone: true, profilePhoto: true, city: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, phone: true, profilePhoto: true, city: true }
        },
        request: {
          select: { id: true, topic: true, sessionType: true, voiceCallSeconds: true, voiceCallLimitSeconds: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const formattedLogs = logs.map(log => {
      const isOutgoing = log.callerId === buddyId;
      const otherUser = isOutgoing ? log.receiver : log.caller;
      return {
        id: log.id,
        requestId: log.requestId,
        type: isOutgoing ? 'Outgoing' : 'Incoming',
        status: log.status,
        durationSec: log.durationSec,
        startedAt: log.startedAt,
        endedAt: log.endedAt,
        user: otherUser,
        request: log.request
      };
    });

    res.json({ success: true, data: formattedLogs });
  } catch (error) {
    console.error('Fetch call logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch call logs' });
  }
});

// GET /api/buddy/availability — fetch availability schedule, status & blocked dates
router.get('/availability', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        isAvailableForRequests: true,
        weeklySchedule: true,
        blockedDates: true,
        availableDays: true,
        availableTimeStart: true,
        availableTimeEnd: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        isAvailableForRequests: user.isAvailableForRequests ?? true,
        weeklySchedule: user.weeklySchedule || [],
        blockedDates: user.blockedDates || [],
        availableDays: user.availableDays || [],
        availableTimeStart: user.availableTimeStart || '',
        availableTimeEnd: user.availableTimeEnd || '',
      }
    });
  } catch (error) {
    console.error('Fetch availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
});

// PUT /api/buddy/availability — update availability schedule, status & blocked dates
router.put('/availability', async (req, res) => {
  try {
    const { isAvailableForRequests, weeklySchedule, blockedDates, availableDays, availableTimeStart, availableTimeEnd } = req.body;
    
    const updateData = {};
    if (typeof isAvailableForRequests === 'boolean') updateData.isAvailableForRequests = isAvailableForRequests;
    if (weeklySchedule !== undefined) updateData.weeklySchedule = weeklySchedule;
    if (Array.isArray(blockedDates)) updateData.blockedDates = blockedDates;
    if (Array.isArray(availableDays)) updateData.availableDays = availableDays;
    if (availableTimeStart !== undefined) updateData.availableTimeStart = availableTimeStart;
    if (availableTimeEnd !== undefined) updateData.availableTimeEnd = availableTimeEnd;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        isAvailableForRequests: true,
        weeklySchedule: true,
        blockedDates: true,
        availableDays: true,
        availableTimeStart: true,
        availableTimeEnd: true,
      }
    });

    res.json({
      success: true,
      message: 'Availability schedule updated successfully!',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
});

module.exports = router;

