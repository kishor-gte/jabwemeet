require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('--- Starting JabWeMeet Database Seeding ---');

  const defaultPassword = await bcrypt.hash('JabWeMeet@2026', 10);

  // Seed / Upsert Only Default Super Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jabweemeet.com' },
    update: {
      name: 'Admin JabWeMeet',
      role: 'ADMIN',
      staffRole: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      isApproved: true,
      identityVerified: true,
      mobileVerified: true,
    },
    create: {
      name: 'Admin JabWeMeet',
      email: 'admin@jabweemeet.com',
      phone: '+919876543210',
      password: defaultPassword,
      dateOfBirth: new Date('1992-05-15'),
      city: 'Mumbai',
      gender: 'Other',
      relationshipIntent: 'Social Connections',
      role: 'ADMIN',
      staffRole: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      isApproved: true,
      identityVerified: true,
      mobileVerified: true,
    },
  });

  console.log('✓ Super Admin user verified/seeded:', admin.email);
  console.log('--- Seeding Completed: Only Super Admin Seeded ---');
}

seed()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

