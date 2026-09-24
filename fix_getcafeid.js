const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

const newGetCafeId = `const getCafeId = async (userId, name) => {
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
};`;

code = code.replace(/const getCafeId = async \([\s\S]*?return profile\.id;\s*\};/, newGetCafeId);
fs.writeFileSync('backend/routes/cafe.js', code);
