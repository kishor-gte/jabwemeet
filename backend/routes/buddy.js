const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['BREAKUP_BUDDY']));

router.get('/dashboard', async (req, res) => {
  try {
    const buddyId = req.user.userId;
    const newRequests = await prisma.buddyRequest.count({ where: { buddyId, status: 'Pending' } });
    const upcomingSessions = await prisma.buddySession.count({ where: { buddyId, status: 'Scheduled' } });
    const completedSessions = await prisma.buddySession.count({ where: { buddyId, status: 'Completed' } });
    res.json({ success: true, data: { newRequests, upcomingSessions, completedSessions } });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const requests = await prisma.buddyRequest.findMany({
      where: { buddyId: req.user.userId },
      include: { user: { select: { name: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await prisma.buddySession.findMany({
      where: { buddyId: req.user.userId, status: 'Scheduled' },
      include: { user: { select: { name: true, profileImage: true } } },
      orderBy: { scheduledAt: 'asc' }
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
      include: { user: { select: { name: true, profileImage: true } } },
      orderBy: { scheduledAt: 'desc' }
    });
    res.json({ success: true, data: history });
  } catch (error) {
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

router.get('/earnings', async (req, res) => {
  try {
    const sessions = await prisma.buddySession.findMany({
      where: { buddyId: req.user.userId, status: 'Completed' },
      orderBy: { scheduledAt: 'desc' }
    });
    let totalEarnings = 0;
    sessions.forEach(s => totalEarnings += s.amountEarned);
    res.json({ success: true, data: { totalEarnings, sessions } });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
