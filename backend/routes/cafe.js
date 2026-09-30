const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const prisma = require('../db');
const router = express.Router();

const isCafe = (req, res, next) => {
  if (req.user && req.user.role === 'CAFE') next();
  else res.status(403).json({ error: 'Access denied' });
};

const handleCafeError = (res, error, defaultMsg = 'An unexpected error occurred') => {
  console.error('Cafe route error:', error);
  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({ 
    success: false, 
    error: isDev ? (error.message || defaultMsg) : defaultMsg 
  });
};

router.use(authenticateToken, isCafe);

const getCafeId = async (userId, name) => {
  let profile = await prisma.cafeProfile.findUnique({ where: { userId } });
  if (!profile) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    profile = await prisma.cafeProfile.create({ 
      data: { 
        userId, 
        cafeName: user ? user.name : name,
        phone: user ? user.phone : null,
        city: user ? user.city : null
      } 
    });
  }
  return profile.id;
};

// PROFILE
router.get('/profile', async (req, res) => {
  try {
    let profile = await prisma.cafeProfile.findUnique({ where: { userId: req.user.userId } });
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    
    if (!profile) {
      profile = await prisma.cafeProfile.create({ 
        data: { 
          userId: req.user.userId, 
          cafeName: user.name,
          phone: user.phone || null,
          city: user.city || null 
        } 
      });
    } else {
      // If the profile exists but phone or city are missing, patch them from the user model so registration data flows in
      let needsUpdate = false;
      let updateData = {};
      if (!profile.phone && user.phone) { updateData.phone = user.phone; needsUpdate = true; }
      if (!profile.city && user.city) { updateData.city = user.city; needsUpdate = true; }
      
      if (needsUpdate) {
        profile = await prisma.cafeProfile.update({
          where: { userId: req.user.userId },
          data: updateData
        });
      }
    }
    res.json({ success: true, data: { ...profile, email: user ? user.email : "" } });
  } catch(e) { handleCafeError(res, e); }
});

router.put('/profile', async (req, res) => {
  try {
    const { email, id, userId, createdAt, updatedAt, ...allowedData } = req.body;
    const profile = await prisma.cafeProfile.update({
      where: { userId: req.user.userId },
      data: allowedData
    });
    res.json({ success: true, data: profile });
  } catch(e) { handleCafeError(res, e); }
});

// MENU
router.get('/menu', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const items = await prisma.menuItem.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: items });
  } catch(e) { handleCafeError(res, e); }
});

router.post('/menu', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const { id, cafeId: _, createdAt, updatedAt, ...allowedData } = req.body;
    const item = await prisma.menuItem.create({ data: { cafeId, ...allowedData } });
    res.json({ success: true, data: item });
  } catch(e) { handleCafeError(res, e); }
});

router.put('/menu/:id', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const existing = await prisma.menuItem.findFirst({ where: { id: req.params.id, cafeId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Menu item not found or unauthorized' });

    const { id, cafeId: _, createdAt, updatedAt, ...allowedData } = req.body;
    const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: allowedData });
    res.json({ success: true, data: item });
  } catch(e) { handleCafeError(res, e); }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const existing = await prisma.menuItem.findFirst({ where: { id: req.params.id, cafeId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Menu item not found or unauthorized' });

    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(e) { handleCafeError(res, e); }
});


// RESERVATIONS
router.get('/reservations', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const filter = req.query.filter || 'Upcoming';
    let whereClause = { cafeId };
    
    if (filter === 'Pending') whereClause.status = 'Pending';
    else if (filter === 'Today') {
      const today = new Date().toISOString().split('T')[0];
      whereClause.date = today;
    }

    const reservations = await prisma.cafeReservation.findMany({ 
      where: whereClause, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json({ success: true, data: reservations });
  } catch(e) { handleCafeError(res, e); }
});

router.put('/reservations/:id/status', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const existing = await prisma.cafeReservation.findFirst({ where: { id: req.params.id, cafeId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Reservation not found or unauthorized' });

    const reservation = await prisma.cafeReservation.update({ 
      where: { id: req.params.id }, 
      data: { status: req.body.status } 
    });
    res.json({ success: true, data: reservation });
  } catch(e) { handleCafeError(res, e); }
});


// ORDERS
router.get('/orders', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const status = req.query.status || 'New';
    
    // Map frontend tab names to DB status if needed, though they match: New, Preparing, Ready, Completed, Cancelled
    const mappedStatus = status.replace(' Orders', ''); // "New Orders" -> "New"
    
    const orders = await prisma.cafeOrder.findMany({ 
      where: { cafeId, status: mappedStatus }, 
      include: { items: true },
      orderBy: { createdAt: 'desc' } 
    });
    res.json({ success: true, data: orders });
  } catch(e) { handleCafeError(res, e); }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const existing = await prisma.cafeOrder.findFirst({ where: { id: req.params.id, cafeId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Order not found or unauthorized' });

    const order = await prisma.cafeOrder.update({ 
      where: { id: req.params.id }, 
      data: { status: req.body.status } 
    });
    res.json({ success: true, data: order });
  } catch(e) { handleCafeError(res, e); }
});

// STAFF
router.get('/staff', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const staff = await prisma.cafeStaff.findMany({ 
      where: { cafeId }, 
      orderBy: { name: 'asc' } 
    });
    res.json({ success: true, data: staff });
  } catch(e) { handleCafeError(res, e); }
});

router.post('/staff', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const { id, cafeId: _, ...allowedData } = req.body;
    const staff = await prisma.cafeStaff.create({ data: { cafeId, ...allowedData } });
    res.json({ success: true, data: staff });
  } catch(e) { handleCafeError(res, e); }
});

router.delete('/staff/:id', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const existing = await prisma.cafeStaff.findFirst({ where: { id: req.params.id, cafeId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Staff member not found or unauthorized' });

    await prisma.cafeStaff.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(e) { handleCafeError(res, e); }
});


// OFFERS
router.get('/offers', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const offers = await prisma.cafeOffer.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: offers });
  } catch(e) { handleCafeError(res, e); }
});

router.post('/offers', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const { id, cafeId: _, createdAt, ...allowedData } = req.body;
    const offer = await prisma.cafeOffer.create({ data: { cafeId, ...allowedData } });
    res.json({ success: true, data: offer });
  } catch(e) { handleCafeError(res, e); }
});

router.delete('/offers/:id', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const existing = await prisma.cafeOffer.findFirst({ where: { id: req.params.id, cafeId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Offer not found or unauthorized' });

    await prisma.cafeOffer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(e) { handleCafeError(res, e); }
});

// CUSTOMERS
router.get('/customers', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const customers = await prisma.cafeCustomer.findMany({ where: { cafeId }, orderBy: { lastVisit: 'desc' } });
    res.json({ success: true, data: customers });
  } catch(e) { handleCafeError(res, e); }
});

// REVIEWS
router.get('/reviews', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const reviews = await prisma.cafeReview.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: reviews });
  } catch(e) { handleCafeError(res, e); }
});

router.post('/reviews/:id/reply', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const existing = await prisma.cafeReview.findFirst({ where: { id: req.params.id, cafeId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Review not found or unauthorized' });

    const review = await prisma.cafeReview.update({ 
      where: { id: req.params.id }, 
      data: { reply: req.body.reply, isReplied: true } 
    });
    res.json({ success: true, data: review });
  } catch(e) { handleCafeError(res, e); }
});

// PAYMENTS (TRANSACTIONS)
router.get('/payments', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const transactions = await prisma.cafeTransaction.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: transactions });
  } catch(e) { handleCafeError(res, e); }
});

// NOTIFICATIONS
router.get('/notifications', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const notifications = await prisma.cafeNotification.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: notifications });
  } catch(e) { handleCafeError(res, e); }
});

// DASHBOARD STATS (MOCK/DYNAMIC BLEND)
router.get('/stats', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const totalMenu = await prisma.menuItem.count({ where: { cafeId } });
    res.json({ 
      success: true, 
      data: {
        totalMenu,
        todayOrders: { value: 0, change: "+0%" },
        reservations: { value: 0, change: "+0%" },
        monthlyRevenue: { value: "INR 0", change: "+0%" },
        customers: { value: 0, change: "+0%" }
      }
    });
  } catch(e) { handleCafeError(res, e); }
});

module.exports = router;
