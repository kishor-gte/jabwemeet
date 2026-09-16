const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all matchmaker routes
router.use(authenticateToken);
router.use(requireRole(['MATCHMAKER']));

// GET /api/matchmaker/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const matchmakerId = req.user.userId;

    // Fetch basic matchmaker details
    const manager = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
      }
    });

    // 1. Fetch assigned clients
    const assignedClients = await prisma.user.findMany({
      where: {
        assignedManagerId: matchmakerId,
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        dateOfBirth: true,
        city: true,
        // using isVerified/isApproved as status proxies for demo
        isVerified: true, 
        updatedAt: true,
      },
      take: 10,
    });

    // Format clients
    const formattedClients = assignedClients.map(c => {
      const age = c.dateOfBirth ? Math.floor((new Date() - new Date(c.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 25;
      return {
        id: c.id,
        name: c.name,
        profileImage: c.profileImage,
        age: age,
        city: c.city,
        status: c.isVerified ? 'Active' : 'In Progress',
        lastActivity: c.updatedAt
      };
    });

    // 2. Fetch pending requests
    const pendingRequests = await prisma.matchmakingRequest.findMany({
      where: {
        status: 'New',
        // In real app, filter by manager assignments or city
      },
      include: {
        client: {
          select: {
            name: true,
            profileImage: true,
            dateOfBirth: true,
            city: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formattedRequests = pendingRequests.map(r => {
      const age = r.client.dateOfBirth ? Math.floor((new Date() - new Date(r.client.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 25;
      return {
        id: r.id,
        clientId: r.clientId,
        clientName: r.client.name,
        profileImage: r.client.profileImage,
        age: age,
        city: r.client.city,
        lookingFor: r.lookingFor || 'Partner',
        status: r.status,
        createdAt: r.createdAt
      };
    });

    // 3. Fetch upcoming schedule
    const schedule = await prisma.appointment.findMany({
      where: {
        matchmakerId: matchmakerId,
        date: {
          gte: new Date(new Date().setHours(0,0,0,0))
        }
      },
      include: {
        client: {
          select: { name: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ],
      take: 5,
    });

    const formattedSchedule = schedule.map(s => ({
      id: s.id,
      clientName: s.client.name,
      date: s.date,
      time: s.time,
      type: s.type,
      mode: s.mode,
      status: s.status
    }));

    // 4. Fetch recent conversations
    const conversations = await prisma.conversation.findMany({
      where: { matchmakerId: matchmakerId },
      include: {
        client: { select: { name: true, profileImage: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: { where: { isRead: false, senderId: { not: matchmakerId } } } }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const formattedMessages = conversations.map(c => ({
      id: c.id,
      clientName: c.client.name,
      profileImage: c.client.profileImage,
      lastMessage: c.messages[0]?.content || '',
      timestamp: c.messages[0]?.createdAt || c.updatedAt,
      unreadCount: c._count.messages
    }));

    // Counts for KPI cards
    const stats = {
      assignedClients: await prisma.user.count({ where: { assignedManagerId: matchmakerId } }),
      pendingRequests: await prisma.matchmakingRequest.count({ where: { status: 'New' } }),
      suggestions: await prisma.matchSuggestion.count({ where: { matchmakerId: matchmakerId, status: 'Pending' } }),
      upcomingSchedules: await prisma.appointment.count({ where: { matchmakerId: matchmakerId, date: { gte: new Date(new Date().setHours(0,0,0,0)) } } })
    };

    return res.json({
      success: true,
      manager,
      stats,
      assignedClients: formattedClients,
      requests: formattedRequests,
      schedule: formattedSchedule,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
  }
});

module.exports = router;
