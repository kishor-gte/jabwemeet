const prisma = require('./db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Starting seedMatchmaker...');

  // Create a matchmaker if not exists
  let matchmaker = await prisma.user.findFirst({
    where: { email: 'matchmaker@jabweemeet.com' }
  });

  if (!matchmaker) {
    const passwordHash = await bcrypt.hash('Matchmaker123!', 10);
    matchmaker = await prisma.user.create({
      data: {
        name: 'Priya Sharma',
        email: 'matchmaker@jabweemeet.com',
        phone: '+919800000001',
        password: passwordHash,
        dateOfBirth: new Date('1990-01-01'),
        city: 'Bengaluru',
        role: 'MATCHMAKER',
        isVerified: true,
        isApproved: true,
        profileImage: 'https://i.pravatar.cc/150?img=5',
      }
    });
    console.log('Created matchmaker:', matchmaker.email);
  } else {
    console.log('Using existing matchmaker:', matchmaker.email);
    // Ensure profile image exists
    await prisma.user.update({
      where: { id: matchmaker.id },
      data: { profileImage: 'https://i.pravatar.cc/150?img=5' }
    });
  }

  // Create some clients assigned to this matchmaker
  const clientsData = [
    { name: 'Ananya Reddy', email: 'ananya@example.com', phone: '+919800000011', city: 'Bengaluru', dob: '1996-05-10', img: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Vikram S', email: 'vikram@example.com', phone: '+919800000012', city: 'Mysuru', dob: '1992-08-15', img: 'https://i.pravatar.cc/150?img=11' },
    { name: 'Sneha Patel', email: 'sneha@example.com', phone: '+919800000013', city: 'Mumbai', dob: '1998-11-20', img: 'https://i.pravatar.cc/150?img=9' },
    { name: 'Rohan Mehta', email: 'rohan@example.com', phone: '+919800000014', city: 'Hyderabad', dob: '1994-03-25', img: 'https://i.pravatar.cc/150?img=12' },
  ];

  for (const c of clientsData) {
    let client = await prisma.user.findUnique({ where: { email: c.email } });
    if (!client) {
      const passwordHash = await bcrypt.hash('Client123!', 10);
      client = await prisma.user.create({
        data: {
          name: c.name,
          email: c.email,
          phone: c.phone,
          password: passwordHash,
          dateOfBirth: new Date(c.dob),
          city: c.city,
          role: 'USER',
          isVerified: true,
          profileImage: c.img,
          assignedManagerId: matchmaker.id,
        }
      });
      console.log('Created client:', client.email);
    }
  }

  // Create pending requests
  const pendingUsers = [
    { name: 'Arjun K', email: 'arjun@example.com', phone: '+919800000021', city: 'Bengaluru', dob: '1995-02-14', img: 'https://i.pravatar.cc/150?img=13' },
    { name: 'Meera S', email: 'meera@example.com', phone: '+919800000022', city: 'Mysuru', dob: '1997-07-22', img: 'https://i.pravatar.cc/150?img=20' },
  ];

  for (const u of pendingUsers) {
    let reqUser = await prisma.user.findUnique({ where: { email: u.email } });
    if (!reqUser) {
      const passwordHash = await bcrypt.hash('Client123!', 10);
      reqUser = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          phone: u.phone,
          password: passwordHash,
          dateOfBirth: new Date(u.dob),
          city: u.city,
          role: 'USER',
          profileImage: u.img,
        }
      });
    }

    const existingReq = await prisma.matchmakingRequest.findFirst({ where: { clientId: reqUser.id } });
    if (!existingReq) {
      await prisma.matchmakingRequest.create({
        data: {
          clientId: reqUser.id,
          lookingFor: 'Partner',
          status: 'New',
        }
      });
      console.log('Created request for:', reqUser.name);
    }
  }

  // Create some appointments
  const vikram = await prisma.user.findUnique({ where: { email: 'vikram@example.com' } });
  if (vikram) {
    const existingAppt = await prisma.appointment.findFirst({ where: { clientId: vikram.id } });
    if (!existingAppt) {
      await prisma.appointment.create({
        data: {
          clientId: vikram.id,
          matchmakerId: matchmaker.id,
          date: new Date(),
          time: '14:30',
          type: 'Follow-up Call',
          mode: 'Phone Call',
          status: 'Scheduled',
        }
      });
      console.log('Created appointment for Vikram');
    }
  }

  // Create suggestions (Pending)
  for (let i = 0; i < 3; i++) {
    await prisma.matchSuggestion.create({
      data: {
        matchmakerId: matchmaker.id,
        clientId: vikram ? vikram.id : matchmaker.id, // Just using some ID for demo
        suggestedProfileId: matchmaker.id, 
        status: 'Pending'
      }
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
