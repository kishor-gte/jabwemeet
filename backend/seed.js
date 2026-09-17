require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Seeding JabWeMeet database...');

  // 1. Seed sample events across all 6 experience categories
  const countEvents = await prisma.event.count();
  if (countEvents === 0) {
    await prisma.event.createMany({
      data: [
        {
          title: 'Rooftop Singles Mixer & Cocktail Evening',
          description: 'An evening of relaxed conversations, great music, and curated icebreakers atop the city skyline.',
          category: 'Singles Events',
          location: 'Sky Lounge, Indiranagar',
          city: 'Bangalore',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          price: 1200,
          maxAttendees: 40,
        },
        {
          title: '5-Minute Chemistry: Speed Dating Edition',
          description: '15 structured mini-conversations with verified members in an intimate café setting.',
          category: 'Speed Dating',
          location: 'Artisan Coffee Roasters, Bandra',
          city: 'Mumbai',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          price: 1500,
          maxAttendees: 30,
        },
        {
          title: 'Curated Blind Dinner Date',
          description: 'Hand-picked pairing based on shared values and relationship goals, hosted at a premier bistro.',
          category: 'Blind Dates',
          location: 'Olive Bistro, Mehrauli',
          city: 'Delhi',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          price: 2500,
          maxAttendees: 10,
        },
        {
          title: 'Beginner Bachata & Salsa Social Date',
          description: 'No partner or dance experience needed! Connect through rhythm, laughter, and movement.',
          category: 'Dance Dates',
          location: 'Movement Studio, Koregaon Park',
          city: 'Pune',
          date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
          price: 900,
          maxAttendees: 35,
        },
        {
          title: 'Weekend Mountain Escape & Bonfire',
          description: 'A 2-day getaway with like-minded singles: stargazing, trail hiking, and acoustic bonfire sessions.',
          category: 'Singles Travel',
          location: 'Cedar Woods Retreat, Manali',
          city: 'Himachal',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          price: 7500,
          maxAttendees: 20,
        },
        {
          title: 'Fresh Start: Breakup Recovery Circle & Comedy',
          description: 'A warm, uplifting space to share stories, laugh together, and embrace new beginnings.',
          category: 'Breakup Community',
          location: 'The Common Room, Cyber Hub',
          city: 'Gurugram',
          date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          price: 500,
          maxAttendees: 25,
        },
      ],
    });
    console.log('Sample JabWeMeet events seeded.');
  }

  // 2. Seed an Admin and Demo User if none exists
  const countUsers = await prisma.user.count();
  if (countUsers === 0) {
    const defaultPassword = await bcrypt.hash('JabWeMeet@2026', 10);

    await prisma.user.create({
      data: {
        name: 'Admin JabWeMeet',
        email: 'admin@jabweemeet.com',
        phone: '+919876543210',
        password: defaultPassword,
        dateOfBirth: new Date('1992-05-15'),
        city: 'Mumbai',
        gender: 'Other',
        relationshipIntent: 'Social Connections',
        role: 'ADMIN',
        isVerified: true,
      },
    });

    await prisma.user.create({
      data: {
        name: 'Rohan Sharma',
        email: 'rohan@jabweemeet.com',
        phone: '+919876543211',
        password: defaultPassword,
        dateOfBirth: new Date('1996-08-20'),
        city: 'Bangalore',
        role: 'USER',
        isVerified: true,
      },
    });

    await prisma.user.create({
      data: {
        name: 'Event Organizer Host',
        email: 'host@jabweemeet.com',
        phone: '+919876543212',
        password: defaultPassword,
        city: 'Mumbai',
        role: 'HOST',
        isVerified: true,
        isApproved: true,
      },
    });

    console.log('Initial Admin, Host, and Demo accounts seeded.');
  }

  console.log('Seeding complete.');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
