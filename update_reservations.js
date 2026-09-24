const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

const reservationsCode = `
// RESERVATIONS
router.get('/reservations', async (req, res) => {
  try {
    const cafeId = await getCafeId(req.user.id, req.user.name);
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
`;

code = code.replace('// DASHBOARD STATS', reservationsCode + '\n// DASHBOARD STATS');
fs.writeFileSync('backend/routes/cafe.js', code);
