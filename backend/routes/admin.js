const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// 1. GET /api/admin/pending
router.get('/pending', async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        role: { in: ['MATCHMAKER', 'BREAKUP_BUDDY', 'HOST'] },
        isApproved: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        govIdProof: true,
        addressProof: true,
        eduCertificate: true,
        workExperience: true,
        idType: true,
        idDocument: true,
        profilePhoto: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      }
    });
    
    return res.json({ success: true, data: pendingUsers });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending applications' });
  }
});

// 2. POST /api/admin/approve/:id
router.post('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.update({
      where: { id },
      data: { isApproved: true },
    });
    
    return res.json({ success: true, message: 'Application approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve application' });
  }
});

// 3. GET /api/admin/events-overview
router.get('/events-overview', async (req, res) => {
  try {
    const [events, bookings, totalUsers] = await Promise.all([
      prisma.event.findMany({
        include: {
          host: {
            select: { id: true, name: true, email: true, phone: true, city: true },
          },
          bookings: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true, city: true },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.eventBooking.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, city: true },
          },
          event: {
            select: { id: true, title: true, category: true, date: true, price: true, city: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
    const totalRevenue = activeBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalEvents: events.length,
        totalBookings: activeBookings.length,
        totalRevenue,
        totalUsers,
      },
      events,
      recentBookings: bookings.slice(0, 20),
    });
  } catch (error) {
    console.error('Error fetching admin events overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch events overview' });
  }
});

module.exports = router;
