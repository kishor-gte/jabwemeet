const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const prisma = require('../db');
const router = express.Router();

const isCafe = (req, res, next) => {
  if (req.user && req.user.role === 'CAFE') next();
  else res.status(403).json({ error: 'Access denied' });
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
    res.json({ success: true, data: profile });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/profile', async (req, res) => {
  try {
    const profile = await prisma.cafeProfile.update({
      where: { userId: req.user.userId },
      data: req.body
    });
    res.json({ success: true, data: profile });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// MENU
router.get('/menu', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const items = await prisma.menuItem.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: items });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/menu', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const item = await prisma.menuItem.create({ data: { cafeId, ...req.body } });
    res.json({ success: true, data: item });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/menu/:id', async (req, res) => {
  try {
    const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: item });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/menu/:id', async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
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
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/reservations/:id/status', async (req, res) => {
  try {
    const reservation = await prisma.cafeReservation.update({ 
      where: { id: req.params.id }, 
      data: { status: req.body.status } 
    });
    res.json({ success: true, data: reservation });
  } catch(e) { res.status(500).json({ error: e.message }); }
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
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const order = await prisma.cafeOrder.update({ 
      where: { id: req.params.id }, 
      data: { status: req.body.status } 
    });
    res.json({ success: true, data: order });
  } catch(e) { res.status(500).json({ error: e.message }); }
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
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/staff', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const staff = await prisma.cafeStaff.create({ data: { cafeId, ...req.body } });
    res.json({ success: true, data: staff });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/staff/:id', async (req, res) => {
  try {
    await prisma.cafeStaff.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});


// OFFERS
router.get('/offers', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const offers = await prisma.cafeOffer.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: offers });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/offers', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const offer = await prisma.cafeOffer.create({ data: { cafeId, ...req.body } });
    res.json({ success: true, data: offer });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/offers/:id', async (req, res) => {
  try {
    await prisma.cafeOffer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// CUSTOMERS
router.get('/customers', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const customers = await prisma.cafeCustomer.findMany({ where: { cafeId }, orderBy: { lastVisit: 'desc' } });
    res.json({ success: true, data: customers });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// REVIEWS
router.get('/reviews', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const reviews = await prisma.cafeReview.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: reviews });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/reviews/:id/reply', async (req, res) => {
  try {
    const review = await prisma.cafeReview.update({ 
      where: { id: req.params.id }, 
      data: { reply: req.body.reply, isReplied: true } 
    });
    res.json({ success: true, data: review });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PAYMENTS (TRANSACTIONS)
router.get('/payments', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const transactions = await prisma.cafeTransaction.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: transactions });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// NOTIFICATIONS
router.get('/notifications', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.userId, req.user.name);
    const notifications = await prisma.cafeNotification.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: notifications });
  } catch(e) { res.status(500).json({ error: e.message }); }
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
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
