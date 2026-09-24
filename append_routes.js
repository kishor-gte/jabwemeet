const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

const newRoutes = `
// ORDERS
router.get('/orders', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.id, req.user.name);
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
    const cafeId = await getCafeId(req.user.id, req.user.name);
    const staff = await prisma.cafeStaff.findMany({ 
      where: { cafeId }, 
      orderBy: { name: 'asc' } 
    });
    res.json({ success: true, data: staff });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/staff', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.id, req.user.name);
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
`;

if (!code.includes('/orders')) {
  code = code.replace('// DASHBOARD STATS', newRoutes + '\n// DASHBOARD STATS');
  fs.writeFileSync('backend/routes/cafe.js', code);
}
