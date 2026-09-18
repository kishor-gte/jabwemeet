require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('--- Starting JabWeMeet Database Seeding ---');


  const defaultPassword = await bcrypt.hash('JabWeMeet@2026', 10);
  const matchmakerPassword = await bcrypt.hash('Matchmaker123!', 10);

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
  } else {
    console.log('Events already exist in the database, skipping event seed.');
  }


  // 1. Seed / Upsert Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jabweemeet.com' },
    update: {
      role: 'ADMIN',
      isVerified: true,
      isApproved: true,
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
      isVerified: true,
      isApproved: true,
    },
  });
  console.log('✓ Admin user verified/seeded:', admin.email);

  // 2. Seed / Upsert Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: 'rohan@jabweemeet.com' },
    update: {
      isVerified: true,
    },
    create: {
      name: 'Rohan Sharma',
      email: 'rohan@jabweemeet.com',
      phone: '+919876543211',
      password: defaultPassword,
      dateOfBirth: new Date('1996-08-20'),
      city: 'Bangalore',
      gender: 'Male',
      relationshipIntent: 'Relationship',
      role: 'USER',
      isVerified: true,
    },
  });
  console.log('✓ Demo user verified/seeded:', demoUser.email);

  // 3. Seed / Upsert Host User
  const hostUser = await prisma.user.upsert({
    where: { email: 'host@jabweemeet.com' },
    update: {
      role: 'HOST',
      isVerified: true,
      isApproved: true,
    },
    create: {
      name: 'Event Organizer Host',
      email: 'host@jabweemeet.com',
      phone: '+919876543212',
      password: defaultPassword,
      dateOfBirth: new Date('1990-03-12'),
      city: 'Mumbai',
      gender: 'Female',
      role: 'HOST',
      isVerified: true,
      isApproved: true,
    },
  });
  console.log('✓ Host user verified/seeded:', hostUser.email);

  // 4. Seed / Upsert Matchmaker (Relationship Manager)
  const matchmaker = await prisma.user.upsert({
    where: { email: 'matchmaker@jabweemeet.com' },
    update: {
      role: 'MATCHMAKER',
      isVerified: true,
      isApproved: true,
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    },
    create: {
      name: 'Priya Sharma',
      email: 'matchmaker@jabweemeet.com',
      phone: '+919800000001',
      password: matchmakerPassword,
      dateOfBirth: new Date('1990-01-01'),
      city: 'Bengaluru',
      gender: 'Female',
      role: 'MATCHMAKER',
      isVerified: true,
      isApproved: true,
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    },
  });
  console.log('✓ Matchmaker verified/seeded:', matchmaker.email);

  // 5. Seed / Upsert Breakup Buddy
  const breakupBuddy = await prisma.user.upsert({
    where: { email: 'buddy@jabweemeet.com' },
    update: {
      role: 'BREAKUP_BUDDY',
      isVerified: true,
      isApproved: true,
      displayName: 'Aarav (Compassionate Listener)',
      shortBio: 'Certified active listener and emotional recovery mentor with 4+ years helping singles rebuild confidence after tough breakups.',
      languages: ['English', 'Hindi'],
      areasOfExpertise: ['Healing After Long-Term Breakups', 'Overcoming Ghosting', 'Rebuilding Self-Esteem'],
      sessionTypes: ['1-on-1 Call', 'Chat Support', 'Video Session'],
      availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
      availableTimeStart: '10:00 AM',
      availableTimeEnd: '09:00 PM',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    },
    create: {
      name: 'Aarav Malhotra',
      email: 'buddy@jabweemeet.com',
      phone: '+919800000002',
      password: defaultPassword,
      dateOfBirth: new Date('1994-06-18'),
      city: 'Mumbai',
      gender: 'Male',
      role: 'BREAKUP_BUDDY',
      isVerified: true,
      isApproved: true,
      displayName: 'Aarav (Compassionate Listener)',
      shortBio: 'Certified active listener and emotional recovery mentor with 4+ years helping singles rebuild confidence after tough breakups.',
      languages: ['English', 'Hindi'],
      areasOfExpertise: ['Healing After Long-Term Breakups', 'Overcoming Ghosting', 'Rebuilding Self-Esteem'],
      sessionTypes: ['1-on-1 Call', 'Chat Support', 'Video Session'],
      availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
      availableTimeStart: '10:00 AM',
      availableTimeEnd: '09:00 PM',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    },
  });
  console.log('✓ Breakup Buddy verified/seeded:', breakupBuddy.email);

  // 6. Seed / Upsert Clients for Matchmaker
  const clientSeedData = [
    { name: 'Ananya Reddy', email: 'ananya@example.com', phone: '+919800000011', city: 'Bengaluru', dob: '1996-05-10', gender: 'Female', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
    { name: 'Vikram Sundaram', email: 'vikram@example.com', phone: '+919800000012', city: 'Mysuru', dob: '1992-08-15', gender: 'Male', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
    { name: 'Sneha Patel', email: 'sneha@example.com', phone: '+919800000013', city: 'Mumbai', dob: '1998-11-20', gender: 'Female', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' },
    { name: 'Rohan Mehta', email: 'rohanm@example.com', phone: '+919800000014', city: 'Hyderabad', dob: '1994-03-25', gender: 'Male', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
  ];

  const seededClients = [];
  for (const c of clientSeedData) {
    const client = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        assignedManagerId: matchmaker.id,
        isVerified: true,
        profileImage: c.img,
      },
      create: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        password: defaultPassword,
        dateOfBirth: new Date(c.dob),
        city: c.city,
        gender: c.gender,
        relationshipIntent: 'Marriage',
        role: 'USER',
        isVerified: true,
        profileImage: c.img,
        assignedManagerId: matchmaker.id,
      },
    });
    seededClients.push(client);
  }
  console.log(`✓ Seeded ${seededClients.length} matchmaking clients.`);

  // 7. Seed Matchmaking Requests
  const pendingIntake = [
    { name: 'Arjun Kapoor', email: 'arjun@example.com', phone: '+919800000021', city: 'Bengaluru', dob: '1995-02-14', gender: 'Male', lookingFor: 'Looking for a kind, career-focused partner in Bengaluru.' },
    { name: 'Meera Sen', email: 'meera@example.com', phone: '+919800000022', city: 'Mumbai', dob: '1997-07-22', gender: 'Female', lookingFor: 'Seeking someone who loves travel, literature, and weekend treks.' },
  ];

  for (const u of pendingIntake) {
    const reqUser = await prisma.user.upsert({
      where: { email: u.email },
      update: { isVerified: true },
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: defaultPassword,
        dateOfBirth: new Date(u.dob),
        city: u.city,
        gender: u.gender,
        role: 'USER',
        isVerified: true,
      },
    });

    const existingReq = await prisma.matchmakingRequest.findFirst({ where: { clientId: reqUser.id } });
    if (!existingReq) {
      await prisma.matchmakingRequest.create({
        data: {
          clientId: reqUser.id,
          lookingFor: u.lookingFor,
          status: 'New',
        },
      });
    }
  }
  console.log('✓ Seeded matchmaking requests.');
  console.log('✓ Initial Admin, Host, and Demo accounts seeded.');

  // 9. Seed Breakup Buddy Requests & Sessions
  if (demoUser) {
    const existingBuddyReq = await prisma.buddyRequest.findFirst({
      where: { userId: demoUser.id, buddyId: breakupBuddy.id },
    });
    if (!existingBuddyReq) {
      await prisma.buddyRequest.create({
        data: {
          userId: demoUser.id,
          buddyId: breakupBuddy.id,
          topic: 'Need support coping after a sudden 3-year breakup',
          sessionType: '1-on-1 Call',
          status: 'Pending',
        },
      });
    }

    const existingSession = await prisma.buddySession.findFirst({
      where: { userId: demoUser.id, buddyId: breakupBuddy.id },
    });
    if (!existingSession) {
      await prisma.buddySession.create({
        data: {
          userId: demoUser.id,
          buddyId: breakupBuddy.id,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          durationMinutes: 45,
          sessionType: 'Video Session',
          status: 'Scheduled',
          amountEarned: 499.0,
        },
      });
    }
  }
  console.log('✓ Seeded buddy requests and appointments.');

  // 10. Seed Events
  const eventsList = [
    {
      title: 'Rooftop Singles Mixer & Cocktail Evening',
      description: 'An evening of relaxed conversations, great music, and curated icebreakers atop the city skyline.',
      category: 'Singles Events',
      location: 'Sky Lounge, Indiranagar',
      city: 'Bangalore',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      price: 1200,
      maxAttendees: 40,
      hostId: hostUser.id,
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
      hostId: hostUser.id,
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
      hostId: hostUser.id,
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
      hostId: hostUser.id,
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
      hostId: hostUser.id,
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
      hostId: hostUser.id,
    },
  ];

  for (const ev of eventsList) {
    const existing = await prisma.event.findFirst({
      where: { title: ev.title },
    });
    if (!existing) {
      await prisma.event.create({ data: ev });
    } else {
      await prisma.event.update({
        where: { id: existing.id },
        data: {
          description: ev.description,
          category: ev.category,
          location: ev.location,
          city: ev.city,
          price: ev.price,
          maxAttendees: ev.maxAttendees,
          hostId: ev.hostId,
        },
      });
    }
  }
  console.log(`✓ Seeded/Updated ${eventsList.length} events.`);

  console.log('\n=== All Seed Data Successfully Pushed to Database! ===');
}

seed()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

