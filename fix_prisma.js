const fs = require('fs');
let code = fs.readFileSync('backend/routes/cafe.js', 'utf8');

code = code.replace(
  "const { PrismaClient } = require('@prisma/client');\nconst prisma = new PrismaClient();",
  "const prisma = require('../db');"
);
// just in case they have different line endings or spacing:
code = code.replace(/const \{ PrismaClient \} = require\('@prisma\/client'\);[\s\r\n]*const prisma = new PrismaClient\(\);/, "const prisma = require('../db');");

fs.writeFileSync('backend/routes/cafe.js', code);
console.log('Fixed Prisma import in cafe.js');
