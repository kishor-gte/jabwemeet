const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

const regex = /router\.put\('\/profile'[\s\S]*?catch\(e\)\s*\{\s*res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}\s*\}\);/g;

const correctPut = `router.put('/profile', async (req, res) => {
  try {
    const { email, id, userId, createdAt, updatedAt, ...allowedData } = req.body;
    const profile = await prisma.cafeProfile.update({
      where: { userId: req.user.userId },
      data: allowedData
    });
    res.json({ success: true, data: profile });
  } catch(e) { res.status(500).json({ error: e.message }); }
});`;

code = code.replace(regex, correctPut);
fs.writeFileSync('backend/routes/cafe.js', code);
