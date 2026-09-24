const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

// We replace the GET /profile route to intelligently pull User data
const profileReplacement = `// PROFILE
router.get('/profile', async (req, res) => {
  try {
    let profile = await prisma.cafeProfile.findUnique({ where: { userId: req.user.id } });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    if (!profile) {
      profile = await prisma.cafeProfile.create({ 
        data: { 
          userId: req.user.id, 
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
          where: { userId: req.user.id },
          data: updateData
        });
      }
    }
    res.json({ success: true, data: profile });
  } catch(e) { res.status(500).json({ error: e.message }); }
});`;

// Replace the old GET /profile block. Be precise.
code = code.replace(/\/\/ PROFILE[\s\S]*?res\.json\(\{ success: true, data: profile \}\);\s*\} catch\(e\) \{ res\.status\(500\)\.json\(\{ error: e\.message \}\); \}\s*\}\);/, profileReplacement);

fs.writeFileSync('backend/routes/cafe.js', code);
