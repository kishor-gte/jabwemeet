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
        role: 'MATCHMAKER',
        isApproved: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        govIdProof: true,
        addressProof: true,
        eduCertificate: true,
        workExperience: true,
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

module.exports = router;
