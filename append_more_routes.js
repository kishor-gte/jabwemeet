const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

const moreRoutes = `
// OFFERS
router.get('/offers', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.id, req.user.name);
    const offers = await prisma.cafeOffer.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: offers });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/offers', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.id, req.user.name);
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
    const cafeId = await getCafeId(req.user.id, req.user.name);
    const customers = await prisma.cafeCustomer.findMany({ where: { cafeId }, orderBy: { lastVisit: 'desc' } });
    res.json({ success: true, data: customers });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// REVIEWS
router.get('/reviews', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.id, req.user.name);
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
    const cafeId = await getCafeId(req.user.id, req.user.name);
    const transactions = await prisma.cafeTransaction.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: transactions });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// NOTIFICATIONS
router.get('/notifications', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.id, req.user.name);
    const notifications = await prisma.cafeNotification.findMany({ where: { cafeId }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: notifications });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
`;

if (!code.includes('/offers')) {
  code = code.replace('// DASHBOARD STATS', moreRoutes + '\n// DASHBOARD STATS');
  fs.writeFileSync('backend/routes/cafe.js', code);
}
