const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

const oldPut = `router.put('/profile', async (req, res) => {
  try {
    const profile = await prisma.cafeProfile.update({
      where: { userId: req.user.userId },
      data: req.body
    });
    res.json({ success: true, data: profile });
  } catch(e) { res.status(500).json({ error: e.message }); }
});`;

const newPut = `router.put('/profile', async (req, res) => {
  try {
    const { email, id, userId, user, createdAt, updatedAt, ...allowedData } = req.body;
    const profile = await prisma.cafeProfile.update({
      where: { userId: req.user.userId },
      data: allowedData
    });
    res.json({ success: true, data: profile });
  } catch(e) { res.status(500).json({ error: e.message }); }
});`;

code = code.replace(oldPut, newPut);
fs.writeFileSync('backend/routes/cafe.js', code);
