const express = require('express');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { logAudit } = require('../services/auditLogger');

const router = express.Router();

// Apply auth middleware and require Admin role on all endpoints
router.use(authenticateToken);
router.use(requireAdmin());

// ==========================================
// 1. ADMIN PROFILE & SESSION
// ==========================================
router.get('/me', async (req, res) => {
  return res.json({
    success: true,
    user: req.staff,
  });
});

// ==========================================
// 2. OVERVIEW & KPI DASHBOARD
// ==========================================
router.get('/overview', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      upcomingEvents,
      todayRegCount,
      revenueResult,
      monthRevenueResult,
      rmSubscribers,
      buddySessionsCount,
      pendingReportsCount,
      openTicketsCount,
      pendingApprovalsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "User" WHERE "status" = 'ACTIVE'`),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.event.count({ where: { date: { gte: new Date() } } }),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "EventRegistration" WHERE "createdAt" >= CURRENT_DATE`),
      prisma.$queryRawUnsafe(`SELECT COALESCE(SUM("amount"), 0)::float as sum FROM "Payment" WHERE "status" = 'SUCCESS'`),
      prisma.$queryRawUnsafe(`SELECT COALESCE(SUM("amount"), 0)::float as sum FROM "Payment" WHERE "status" = 'SUCCESS' AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)`),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "User" WHERE "assignedManagerId" IS NOT NULL OR "role" = 'MATCHMAKER'`),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "BuddySession"`),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "Report" WHERE "status" = 'OPEN'`),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "SupportTicket" WHERE "status" = 'OPEN'`),
      prisma.user.count({ where: { role: { in: ['MATCHMAKER', 'BREAKUP_BUDDY'] }, isApproved: false } }),
    ]);

    // Quick Alerts Center data
    const alerts = [
      {
        id: 'safety',
        title: 'Safety Reports',
        count: pendingReportsCount[0]?.count || 0,
        severity: 'danger',
        badge: '🔴 Urgent',
        link: '/admin/safety',
      },
      {
        id: 'verifications',
        title: 'Pending Staff & Member Verifications',
        count: pendingApprovalsCount || 0,
        severity: 'warning',
        badge: '🟠 Action Required',
        link: '/admin/verification',
      },
      {
        id: 'support',
        title: 'Open Support Tickets',
        count: openTicketsCount[0]?.count || 0,
        severity: 'warning',
        badge: '🟡 Open Cases',
        link: '/admin/support',
      },
      {
        id: 'refunds',
        title: 'Pending Refund Requests',
        count: 0,
        severity: 'warning',
        badge: '🟡 Finance Review',
        link: '/admin/payments/refunds',
      },
      {
        id: 'rm_requests',
        title: 'New Introduction / RM Requests',
        count: await prisma.matchmakingRequest.count({ where: { status: 'New' } }),
        severity: 'info',
        badge: '🔵 Matchmaking',
        link: '/admin/matchmaking',
      },
      {
        id: 'buddy_requests',
        title: 'Pending Breakup Buddy Requests',
        count: await prisma.buddyRequest.count({ where: { status: 'Pending' } }),
        severity: 'info',
        badge: '🔵 Buddy Circles',
        link: '/admin/breakup-buddies',
      },
    ];

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers: activeUsers[0]?.count || 0,
        verifiedUsers,
        upcomingEvents,
        todayRegistrations: todayRegCount[0]?.count || 0,
        totalRevenue: revenueResult[0]?.sum || 0,
        monthlyRevenue: monthRevenueResult[0]?.sum || 0,
        rmSubscribers: rmSubscribers[0]?.count || 0,
        buddySessions: buddySessionsCount[0]?.count || 0,
        pendingReports: pendingReportsCount[0]?.count || 0,
        openSupportTickets: openTicketsCount[0]?.count || 0,
        pendingApprovals: pendingApprovalsCount,
      },
      alerts,
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch overview data' });
  }
});

// ==========================================
// 3. ANALYTICS & TIME-SERIES DATA
// ==========================================
router.get('/analytics', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;
    else if (range === '1y') days = 365;

    // Daily user registrations
    const userRegistrations = await prisma.$queryRawUnsafe(`
      SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::int as count
      FROM "User"
      WHERE "createdAt" >= NOW() - INTERVAL '${days} days'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `);

    // Revenue by category
    const revenueByCategory = await prisma.$queryRawUnsafe(`
      SELECT "type", COALESCE(SUM("amount"), 0)::float as total, COUNT(*)::int as transactions
      FROM "Payment"
      WHERE "status" = 'SUCCESS' AND "createdAt" >= NOW() - INTERVAL '${days} days'
      GROUP BY "type"
    `);

    // Event status breakdown
    const eventStats = await prisma.$queryRawUnsafe(`
      SELECT COALESCE("status", 'PUBLISHED') as status, COUNT(*)::int as count
      FROM "Event"
      GROUP BY "status"
    `);

    // Top cities distribution
    const cityDistribution = await prisma.$queryRawUnsafe(`
      SELECT COALESCE("city", 'Unspecified') as city, COUNT(*)::int as count
      FROM "User"
      GROUP BY "city"
      ORDER BY count DESC
      LIMIT 8
    `);

    // Service analytics
    const [rmRequests, buddyRequests, completedSessions] = await Promise.all([
      prisma.matchmakingRequest.count(),
      prisma.buddyRequest.count(),
      prisma.buddySession.count({ where: { status: 'Completed' } }),
    ]);

    return res.json({
      success: true,
      range,
      data: {
        userRegistrations,
        revenueByCategory,
        eventStats,
        cityDistribution,
        services: {
          rmRequests,
          buddyRequests,
          completedSessions,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics data' });
  }
});

// ==========================================
// 4. GLOBAL SEARCH
// ==========================================
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ success: true, results: { users: [], events: [], payments: [], tickets: [], reports: [] } });
    }

    const searchTerm = `%${q.trim().toLowerCase()}%`;

    const [users, events, payments, reports, tickets] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT "id", "name", "email", "phone", "role", "city", "status"
        FROM "User"
        WHERE LOWER("name") LIKE $1 OR LOWER("email") LIKE $1 OR "phone" LIKE $1
        LIMIT 6
      `, searchTerm),
      prisma.$queryRawUnsafe(`
        SELECT "id", "title", "category", "city", "date", "price", "status"
        FROM "Event"
        WHERE LOWER("title") LIKE $1 OR LOWER("city") LIKE $1 OR LOWER("category") LIKE $1
        LIMIT 6
      `, searchTerm),
      prisma.$queryRawUnsafe(`
        SELECT "id", "userId", "type", "amount", "status", "createdAt"
        FROM "Payment"
        WHERE "id" LIKE $1 OR "referenceId" LIKE $1
        LIMIT 6
      `, searchTerm),
      prisma.$queryRawUnsafe(`
        SELECT "id", "category", "reason", "status", "createdAt"
        FROM "Report"
        WHERE LOWER("reason") LIKE $1 OR "id" LIKE $1
        LIMIT 6
      `, searchTerm),
      prisma.$queryRawUnsafe(`
        SELECT "id", "ticketNumber", "category", "subject", "status"
        FROM "SupportTicket"
        WHERE LOWER("subject") LIKE $1 OR "ticketNumber" LIKE $1
        LIMIT 6
      `, searchTerm),
    ]);

    return res.json({
      success: true,
      results: { users, events, payments, reports, tickets },
    });
  } catch (error) {
    console.error('Error in global search:', error);
    return res.status(500).json({ success: false, message: 'Search query failed' });
  }
});

// ==========================================
// 5. USER MANAGEMENT
// ==========================================
router.get('/users', async (req, res) => {
  try {
    const { search, role, status, city, verification, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    let whereClauses = ['1=1'];
    let params = [];
    let pIdx = 1;

    if (search) {
      whereClauses.push(`(LOWER("name") LIKE $${pIdx} OR LOWER("email") LIKE $${pIdx} OR "phone" LIKE $${pIdx})`);
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    if (role && role !== 'ALL') {
      whereClauses.push(`"role"::text = $${pIdx}`);
      params.push(role);
      pIdx++;
    }

    if (status && status !== 'ALL') {
      whereClauses.push(`"status" = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (city && city !== 'ALL') {
      whereClauses.push(`LOWER("city") = $${pIdx}`);
      params.push(city.trim().toLowerCase());
      pIdx++;
    }

    if (verification === 'VERIFIED') {
      whereClauses.push(`"isVerified" = true`);
    } else if (verification === 'UNVERIFIED') {
      whereClauses.push(`"isVerified" = false`);
    }

    const whereSql = whereClauses.join(' AND ');

    const countQuery = `SELECT COUNT(*)::int as count FROM "User" WHERE ${whereSql}`;
    const totalResult = await prisma.$queryRawUnsafe(countQuery, ...params);
    const totalUsers = totalResult[0]?.count || 0;

    const dataQuery = `
      SELECT "id", "name", "email", "phone", "city", "gender", "dateOfBirth", "role",
             COALESCE("status", 'ACTIVE') as status, "isVerified", "isApproved",
             "createdAt", "updatedAt", "profilePhoto", "profileImage", "staffRole", "lastActiveAt"
      FROM "User"
      WHERE ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;
    params.push(pageSize, offset);

    const users = await prisma.$queryRawUnsafe(dataQuery, ...params);

    return res.json({
      success: true,
      users,
      pagination: {
        total: totalUsers,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalUsers / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        assignedManager: {
          select: { id: true, name: true, email: true, phone: true },
        },
        assignedClients: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch related records in parallel
    const [registrations, payments, reports, supportTickets, buddySessions] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT er.*, e."title" as "eventTitle", e."date" as "eventDate", e."city" as "eventCity", e."price" as "eventPrice"
        FROM "EventRegistration" er
        JOIN "Event" e ON er."eventId" = e."id"
        WHERE er."userId" = $1
        ORDER BY er."createdAt" DESC
      `, id),
      prisma.$queryRawUnsafe(`
        SELECT * FROM "Payment" WHERE "userId" = $1 ORDER BY "createdAt" DESC
      `, id),
      prisma.$queryRawUnsafe(`
        SELECT * FROM "Report" WHERE "reportedUserId" = $1 OR "reporterId" = $1 ORDER BY "createdAt" DESC
      `, id),
      prisma.$queryRawUnsafe(`
        SELECT * FROM "SupportTicket" WHERE "userId" = $1 ORDER BY "createdAt" DESC
      `, id),
      prisma.buddySession.findMany({
        where: { OR: [{ userId: id }, { buddyId: id }] },
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);

    // Build chronological Activity Timeline from real events
    const timeline = [];
    if (user.createdAt) {
      timeline.push({ type: 'ACCOUNT_CREATED', title: 'Account Created', date: user.createdAt, description: 'User registered on JabWeMeet' });
    }
    if (user.isVerified) {
      timeline.push({ type: 'VERIFIED', title: 'Account Verified', date: user.createdAt, description: 'Profile verified' });
    }
    registrations.forEach(r => {
      timeline.push({
        type: 'EVENT_REGISTRATION',
        title: `Registered for ${r.eventTitle}`,
        date: r.createdAt,
        description: `Pass code: ${r.ticketCode} (${r.paymentStatus})`,
      });
      if (r.checkedIn && r.checkedInAt) {
        timeline.push({
          type: 'EVENT_ATTENDED',
          title: `Attended ${r.eventTitle}`,
          date: r.checkedInAt,
          description: `Checked in at venue desk`,
        });
      }
    });
    payments.forEach(p => {
      timeline.push({
        type: 'PAYMENT',
        title: `Payment ₹${p.amount}`,
        date: p.createdAt,
        description: `${p.type} via ${p.gateway} (${p.status})`,
      });
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Remove password hash before returning
    const { password, ...safeUser } = user;

    return res.json({
      success: true,
      user: safeUser,
      registrations,
      payments,
      reports,
      supportTickets,
      buddySessions,
      timeline,
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isVerified, isApproved, staffRole, internalNotes, reason } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = [];
    const params = [];
    let pIdx = 1;

    if (status !== undefined) {
      updates.push(`"status" = $${pIdx++}`);
      params.push(status);
    }
    if (isVerified !== undefined) {
      updates.push(`"isVerified" = $${pIdx++}`);
      params.push(Boolean(isVerified));
    }
    if (isApproved !== undefined) {
      updates.push(`"isApproved" = $${pIdx++}`);
      params.push(Boolean(isApproved));
    }
    if (staffRole !== undefined) {
      updates.push(`"staffRole" = $${pIdx++}`);
      params.push('SUPER_ADMIN');
    }
    if (internalNotes !== undefined) {
      updates.push(`"internalNotes" = $${pIdx++}`);
      params.push(internalNotes);
    }

    if (updates.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET ${updates.join(', ')}, "updatedAt" = NOW() WHERE "id" = $${pIdx}`,
        ...params
      );
    }

    await logAudit(req, {
      action: `USER_STATUS_UPDATE_${status || 'MODIFIED'}`,
      targetType: 'USER',
      targetId: id,
      before: { status: existingUser.status, isVerified: existingUser.isVerified, isApproved: existingUser.isApproved },
      after: { status, isVerified, isApproved, staffRole, internalNotes },
      reason: reason || 'Administrative profile status modification',
    });

    return res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

// ==========================================
// 6. EVENT MANAGEMENT & REGISTRATIONS
// ==========================================
router.get('/events', async (req, res) => {
  try {
    const { search, category, city, status } = req.query;

    let whereClauses = ['1=1'];
    let params = [];
    let pIdx = 1;

    if (search) {
      whereClauses.push(`(LOWER(e."title") LIKE $${pIdx} OR LOWER(e."location") LIKE $${pIdx})`);
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }
    if (category && category !== 'ALL') {
      whereClauses.push(`e."category" = $${pIdx}`);
      params.push(category);
      pIdx++;
    }
    if (city && city !== 'ALL') {
      whereClauses.push(`LOWER(e."city") = $${pIdx}`);
      params.push(city.trim().toLowerCase());
      pIdx++;
    }
    if (status && status !== 'ALL') {
      whereClauses.push(`e."status" = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    const query = `
      SELECT e.*, 
             u."name" as "hostName", u."email" as "hostEmail",
             COUNT(er."id")::int as "registeredCount",
             COUNT(CASE WHEN er."checkedIn" = true THEN 1 END)::int as "checkedInCount"
      FROM "Event" e
      LEFT JOIN "User" u ON e."hostId" = u."id"
      LEFT JOIN "EventRegistration" er ON e."id" = er."eventId"
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY e."id", u."name", u."email"
      ORDER BY e."date" DESC
    `;

    const events = await prisma.$queryRawUnsafe(query, ...params);

    return res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching admin events:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

router.post('/events', async (req, res) => {
  try {
    const {
      title, description, category, location, city, date, endDate,
      price = 0, maxAttendees = 40, ageRange = '21-35', itinerary = '',
      coverImage = '', address = '', mapLocation = '', rules = '',
      participationRules = '', dressCode = 'Smart Casual', status = 'PUBLISHED', faqs = []
    } = req.body;

    if (!title || !description || !category || !location || !city || !date) {
      return res.status(400).json({ success: false, message: 'Missing required event fields' });
    }

    const eventId = 'evt-' + Date.now();
    const hostId = req.staff.id;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Event" (
        "id", "title", "description", "category", "location", "city",
        "date", "endDate", "price", "maxAttendees", "ageRange", "itinerary",
        "hostId", "coverImage", "address", "mapLocation", "rules",
        "participationRules", "dressCode", "status", "faqs", "createdAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21::jsonb, NOW())
    `,
      eventId, title, description, category, location, city,
      new Date(date), endDate ? new Date(endDate) : null, parseFloat(price),
      parseInt(maxAttendees, 10), ageRange, itinerary, hostId, coverImage,
      address, mapLocation, rules, participationRules, dressCode, status,
      JSON.stringify(faqs)
    );

    await logAudit(req, {
      action: 'EVENT_CREATE',
      targetType: 'EVENT',
      targetId: eventId,
      after: { title, category, city, date, price, maxAttendees, status },
      reason: 'Created new event from admin control center',
    });

    return res.status(201).json({ success: true, message: 'Event created successfully', eventId });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event' });
  }
});

router.patch('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const fieldMap = [
      'title', 'description', 'category', 'location', 'city', 'ageRange',
      'itinerary', 'coverImage', 'address', 'mapLocation', 'rules',
      'participationRules', 'dressCode', 'status'
    ];

    const updates = [];
    const params = [];
    let pIdx = 1;

    for (const f of fieldMap) {
      if (body[f] !== undefined) {
        updates.push(`"${f}" = $${pIdx++}`);
        params.push(body[f]);
      }
    }

    if (body.price !== undefined) {
      updates.push(`"price" = $${pIdx++}`);
      params.push(parseFloat(body.price));
    }
    if (body.maxAttendees !== undefined) {
      updates.push(`"maxAttendees" = $${pIdx++}`);
      params.push(parseInt(body.maxAttendees, 10));
    }
    if (body.date) {
      updates.push(`"date" = $${pIdx++}`);
      params.push(new Date(body.date));
    }
    if (body.endDate !== undefined) {
      updates.push(`"endDate" = $${pIdx++}`);
      params.push(body.endDate ? new Date(body.endDate) : null);
    }
    if (body.faqs !== undefined) {
      updates.push(`"faqs" = $${pIdx++}::jsonb`);
      params.push(JSON.stringify(body.faqs));
    }

    if (updates.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(
        `UPDATE "Event" SET ${updates.join(', ')} WHERE "id" = $${pIdx}`,
        ...params
      );
    }

    await logAudit(req, {
      action: 'EVENT_UPDATE',
      targetType: 'EVENT',
      targetId: id,
      before: existingEvent,
      after: body,
      reason: body.status ? `Event status updated to ${body.status}` : 'Admin edited event details',
    });

    return res.json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await prisma.$executeRawUnsafe(`UPDATE "Event" SET "status" = 'ARCHIVED' WHERE "id" = $1`, id);

    await logAudit(req, {
      action: 'EVENT_ARCHIVE',
      targetType: 'EVENT',
      targetId: id,
      before: { status: existing.status },
      after: { status: 'ARCHIVED' },
      reason: 'Administrative event archive',
    });

    return res.json({ success: true, message: 'Event archived successfully' });
  } catch (error) {
    console.error('Error archiving event:', error);
    return res.status(500).json({ success: false, message: 'Failed to archive event' });
  }
});

// Event Registrations & Attendance Desk
router.get('/events/:id/registrations', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const registrations = await prisma.$queryRawUnsafe(`
      SELECT er.*, u."name" as "userName", u."email" as "userEmail", u."phone" as "userPhone", u."city" as "userCity"
      FROM "EventRegistration" er
      JOIN "User" u ON er."userId" = u."id"
      WHERE er."eventId" = $1
      ORDER BY er."createdAt" DESC
    `, id);

    const stats = {
      total: registrations.length,
      paid: registrations.filter(r => r.paymentStatus === 'PAID').length,
      pending: registrations.filter(r => r.paymentStatus === 'PENDING').length,
      cancelled: registrations.filter(r => r.status === 'CANCELLED').length,
      checkedIn: registrations.filter(r => r.checkedIn).length,
      noShow: registrations.filter(r => !r.checkedIn && new Date(event.date) < new Date()).length,
      availableSeats: Math.max(0, (event.maxAttendees || 50) - registrations.filter(r => r.status !== 'CANCELLED').length),
    };

    return res.json({ success: true, event, registrations, stats });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch event registrations' });
  }
});

router.post('/events/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;
    const { registrationId, ticketCode, checkedIn = true, notes } = req.body;

    let targetRegistration = null;
    if (registrationId) {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "EventRegistration" WHERE "id" = $1 AND "eventId" = $2`, registrationId, id);
      targetRegistration = rows[0];
    } else if (ticketCode) {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "EventRegistration" WHERE "ticketCode" = $1 AND "eventId" = $2`, ticketCode.trim().toUpperCase(), id);
      targetRegistration = rows[0];
    }

    if (!targetRegistration) {
      return res.status(404).json({ success: false, message: 'Registration record or ticket code not found' });
    }

    const checkInTime = checkedIn ? new Date() : null;

    await prisma.$executeRawUnsafe(`
      UPDATE "EventRegistration"
      SET "checkedIn" = $1, "checkedInAt" = $2
      WHERE "id" = $3
    `, checkedIn, checkInTime, targetRegistration.id);

    await logAudit(req, {
      action: checkedIn ? 'ATTENDANCE_CHECK_IN' : 'ATTENDANCE_REVERSAL',
      targetType: 'EVENT_REGISTRATION',
      targetId: targetRegistration.id,
      before: { checkedIn: targetRegistration.checkedIn, checkedInAt: targetRegistration.checkedInAt },
      after: { checkedIn, checkedInAt: checkInTime },
      reason: notes || 'Event desk check-in updated',
    });

    return res.json({
      success: true,
      message: checkedIn ? 'Participant checked in successfully' : 'Check-in reversed',
      registrationId: targetRegistration.id,
      checkedIn,
      checkedInAt: checkInTime,
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to update attendance' });
  }
});

// ==========================================
// 7. EVENT MANAGERS / HOSTS
// ==========================================
router.get('/event-managers', async (req, res) => {
  try {
    const managers = await prisma.$queryRawUnsafe(`
      SELECT u."id", u."name", u."email", u."phone", u."city", u."isVerified", u."isApproved",
             COALESCE(u."status", 'ACTIVE') as status, u."createdAt",
             COUNT(e."id")::int as "assignedEventsCount",
             COUNT(CASE WHEN e."date" >= NOW() THEN 1 END)::int as "upcomingEventsCount",
             COUNT(CASE WHEN e."date" < NOW() THEN 1 END)::int as "completedEventsCount"
      FROM "User" u
      LEFT JOIN "Event" e ON u."id" = e."hostId"
      WHERE u."role"::text IN ('HOST', 'EVENT_MANAGER')
      GROUP BY u."id"
      ORDER BY u."createdAt" DESC
    `);

    return res.json({ success: true, managers });
  } catch (error) {
    console.error('Error fetching event managers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch event managers' });
  }
});

// ==========================================
// 8. RELATIONSHIP MANAGERS
// ==========================================
router.get('/relationship-managers', async (req, res) => {
  try {
    const managers = await prisma.$queryRawUnsafe(`
      SELECT u."id", u."name", u."email", u."phone", u."city", u."gender", u."profileImage",
             u."isVerified", u."isApproved", COALESCE(u."status", 'ACTIVE') as "status",
             u."createdAt", u."govIdProof", u."addressProof", u."eduCertificate", u."workExperience",
             COUNT(DISTINCT c."id")::int as "assignedClientsCount",
             COUNT(DISTINCT ms."id")::int as "madeSuggestionsCount",
             COUNT(DISTINCT a."id")::int as "appointmentsCount"
      FROM "User" u
      LEFT JOIN "User" c ON c."assignedManagerId" = u."id"
      LEFT JOIN "MatchSuggestion" ms ON ms."matchmakerId" = u."id"
      LEFT JOIN "Appointment" a ON a."matchmakerId" = u."id"
      WHERE u."role"::text = 'MATCHMAKER'
      GROUP BY u."id"
      ORDER BY u."createdAt" DESC
    `);

    const pendingRequestsCount = await prisma.matchmakingRequest.count({ where: { status: 'New' } });

    return res.json({ success: true, managers, pendingRequestsCount });
  } catch (error) {
    console.error('Error fetching relationship managers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch relationship managers' });
  }
});

router.patch('/relationship-managers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, status, assignClientId, reassignManagerId, reason } = req.body;

    const manager = await prisma.user.findUnique({ where: { id } });
    if (!manager) {
      return res.status(404).json({ success: false, message: 'Relationship manager not found' });
    }

    if (isApproved !== undefined) {
      await prisma.user.update({ where: { id }, data: { isApproved: Boolean(isApproved) } });
    }
    if (status !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE "User" SET "status" = $1 WHERE "id" = $2`, status, id);
    }

    // Client assignment / reassignment
    if (assignClientId) {
      await prisma.user.update({
        where: { id: assignClientId },
        data: { assignedManagerId: id },
      });
    }

    if (reassignManagerId && assignClientId) {
      await prisma.user.update({
        where: { id: assignClientId },
        data: { assignedManagerId: reassignManagerId },
      });
    }

    await logAudit(req, {
      action: 'RELATIONSHIP_MANAGER_UPDATE',
      targetType: 'USER',
      targetId: id,
      before: { isApproved: manager.isApproved },
      after: { isApproved, status, assignClientId, reassignManagerId },
      reason: reason || 'Admin updated Relationship Manager status or client assignments',
    });

    return res.json({ success: true, message: 'Relationship manager updated successfully' });
  } catch (error) {
    console.error('Error updating relationship manager:', error);
    return res.status(500).json({ success: false, message: 'Failed to update relationship manager' });
  }
});

// ==========================================
// 9. BREAKUP BUDDIES & SESSIONS
// ==========================================
router.get('/breakup-buddies', async (req, res) => {
  try {
    const buddies = await prisma.$queryRawUnsafe(`
      SELECT u."id", u."name", u."displayName", u."email", u."phone", u."city", u."profilePhoto",
             u."shortBio", u."languages", u."areasOfExpertise", u."sessionTypes", u."availableDays",
             u."availableTimeStart", u."availableTimeEnd", u."isVerified", u."isApproved",
             COALESCE(u."status", 'ACTIVE') as "status", u."createdAt", u."idType", u."idDocument",
             COUNT(DISTINCT bs."id")::int as "sessionsCount",
             COUNT(DISTINCT br."id")::int as "requestsCount",
             COUNT(DISTINCT rv."id")::int as "reviewsCount"
      FROM "User" u
      LEFT JOIN "BuddySession" bs ON bs."buddyId" = u."id"
      LEFT JOIN "BuddyRequest" br ON br."buddyId" = u."id"
      LEFT JOIN "BuddyReview" rv ON rv."buddyId" = u."id"
      WHERE u."role"::text = 'BREAKUP_BUDDY'
      GROUP BY u."id"
      ORDER BY u."createdAt" DESC
    `);

    return res.json({ success: true, buddies });
  } catch (error) {
    console.error('Error fetching breakup buddies:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch breakup buddies' });
  }
});

router.patch('/breakup-buddies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, status, availableDays, availableTimeStart, availableTimeEnd, reason } = req.body;

    const buddy = await prisma.user.findUnique({ where: { id } });
    if (!buddy) {
      return res.status(404).json({ success: false, message: 'Breakup buddy not found' });
    }

    const updateData = {};
    if (isApproved !== undefined) updateData.isApproved = Boolean(isApproved);
    if (availableDays) updateData.availableDays = availableDays;
    if (availableTimeStart) updateData.availableTimeStart = availableTimeStart;
    if (availableTimeEnd) updateData.availableTimeEnd = availableTimeEnd;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { id }, data: updateData });
    }
    if (status !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE "User" SET "status" = $1 WHERE "id" = $2`, status, id);
    }

    await logAudit(req, {
      action: 'BREAKUP_BUDDY_UPDATE',
      targetType: 'USER',
      targetId: id,
      before: { isApproved: buddy.isApproved, status: buddy.status },
      after: { isApproved, status, availableDays, availableTimeStart, availableTimeEnd },
      reason: reason || 'Admin updated Breakup Buddy details',
    });

    return res.json({ success: true, message: 'Breakup buddy updated successfully' });
  } catch (error) {
    console.error('Error updating breakup buddy:', error);
    return res.status(500).json({ success: false, message: 'Failed to update breakup buddy' });
  }
});

router.get('/buddy-sessions', async (req, res) => {
  try {
    const sessions = await prisma.buddySession.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        buddy: { select: { id: true, name: true, displayName: true, email: true, phone: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching buddy sessions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch buddy sessions' });
  }
});

// ==========================================
// 10. MATCHMAKING CONTROL CENTER & DATES
// ==========================================
router.get('/matchmaking', async (req, res) => {
  try {
    const [requests, suggestions, appointments] = await Promise.all([
      prisma.matchmakingRequest.findMany({
        include: {
          client: { select: { id: true, name: true, email: true, phone: true, city: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.matchSuggestion.findMany({
        include: {
          client: { select: { id: true, name: true, email: true, city: true } },
          matchmaker: { select: { id: true, name: true, email: true } },
          suggestedProfile: { select: { id: true, name: true, email: true, city: true, dateOfBirth: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.appointment.findMany({
        include: {
          client: { select: { id: true, name: true, phone: true } },
          matchmaker: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    return res.json({ success: true, requests, suggestions, appointments });
  } catch (error) {
    console.error('Error fetching matchmaking center data:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch matchmaking data' });
  }
});

router.patch('/matchmaking/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const request = await prisma.matchmakingRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Matchmaking request not found' });
    }

    await prisma.matchmakingRequest.update({
      where: { id },
      data: { status },
    });

    await logAudit(req, {
      action: 'MATCHMAKING_REQUEST_STATUS',
      targetType: 'MATCHMAKING_REQUEST',
      targetId: id,
      before: { status: request.status },
      after: { status },
      reason: reason || 'Matchmaking request status changed by admin',
    });

    return res.json({ success: true, message: 'Request status updated' });
  } catch (error) {
    console.error('Error updating matchmaking request:', error);
    return res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

router.get('/dates', async (req, res) => {
  try {
    const dates = await prisma.appointment.findMany({
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        matchmaker: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    return res.json({ success: true, dates });
  } catch (error) {
    console.error('Error fetching dates:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch scheduled dates' });
  }
});

router.patch('/dates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, time, reason } = req.body;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;

    await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    await logAudit(req, {
      action: 'DATE_SCHEDULE_UPDATE',
      targetType: 'APPOINTMENT',
      targetId: id,
      before: appointment,
      after: updateData,
      reason: reason || 'Date schedule updated by admin',
    });

    return res.json({ success: true, message: 'Date schedule updated' });
  } catch (error) {
    console.error('Error updating date:', error);
    return res.status(500).json({ success: false, message: 'Failed to update date' });
  }
});

// ==========================================
// 11. SERVICE PACKAGES & SUBSCRIPTIONS
// ==========================================
router.get('/services/packages', async (req, res) => {
  try {
    const packages = await prisma.$queryRawUnsafe(`
      SELECT * FROM "ServicePackage" ORDER BY "type", "price" ASC
    `);
    return res.json({ success: true, packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch packages' });
  }
});

router.post('/services/packages', async (req, res) => {
  try {
    const { type, name, price, billingCycle = 'MONTHLY', durationDays = 30, sessionLimit = 4, callLimit = 8, chatLimit = 100, description = '', features = [] } = req.body;
    if (!type || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Package type, name and price are required' });
    }

    const packageId = 'pkg-' + Date.now();

    await prisma.$executeRawUnsafe(`
      INSERT INTO "ServicePackage" ("id", "type", "name", "price", "billingCycle", "durationDays", "sessionLimit", "callLimit", "chatLimit", "description", "features", "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, true)
    `, packageId, type, name, parseFloat(price), billingCycle, parseInt(durationDays, 10), parseInt(sessionLimit, 10), parseInt(callLimit, 10), parseInt(chatLimit, 10), description, JSON.stringify(features));

    await logAudit(req, {
      action: 'SERVICE_PACKAGE_CREATE',
      targetType: 'SERVICE_PACKAGE',
      targetId: packageId,
      after: { type, name, price, billingCycle },
      reason: 'Admin created service package',
    });

    return res.status(201).json({ success: true, message: 'Package created', packageId });
  } catch (error) {
    console.error('Error creating package:', error);
    return res.status(500).json({ success: false, message: 'Failed to create package' });
  }
});

router.patch('/services/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const fields = ['name', 'type', 'billingCycle', 'description'];
    const updates = [];
    const params = [];
    let pIdx = 1;

    for (const f of fields) {
      if (body[f] !== undefined) {
        updates.push(`"${f}" = $${pIdx++}`);
        params.push(body[f]);
      }
    }
    if (body.price !== undefined) {
      updates.push(`"price" = $${pIdx++}`);
      params.push(parseFloat(body.price));
    }
    if (body.durationDays !== undefined) {
      updates.push(`"durationDays" = $${pIdx++}`);
      params.push(parseInt(body.durationDays, 10));
    }
    if (body.sessionLimit !== undefined) {
      updates.push(`"sessionLimit" = $${pIdx++}`);
      params.push(parseInt(body.sessionLimit, 10));
    }
    if (body.callLimit !== undefined) {
      updates.push(`"callLimit" = $${pIdx++}`);
      params.push(parseInt(body.callLimit, 10));
    }
    if (body.chatLimit !== undefined) {
      updates.push(`"chatLimit" = $${pIdx++}`);
      params.push(parseInt(body.chatLimit, 10));
    }
    if (body.isActive !== undefined) {
      updates.push(`"isActive" = $${pIdx++}`);
      params.push(Boolean(body.isActive));
    }
    if (body.features !== undefined) {
      updates.push(`"features" = $${pIdx++}::jsonb`);
      params.push(JSON.stringify(body.features));
    }

    if (updates.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(
        `UPDATE "ServicePackage" SET ${updates.join(', ')} WHERE "id" = $${pIdx}`,
        ...params
      );
    }

    await logAudit(req, {
      action: 'SERVICE_PACKAGE_UPDATE',
      targetType: 'SERVICE_PACKAGE',
      targetId: id,
      after: body,
      reason: 'Admin updated package configuration',
    });

    return res.json({ success: true, message: 'Package updated' });
  } catch (error) {
    console.error('Error updating package:', error);
    return res.status(500).json({ success: false, message: 'Failed to update package' });
  }
});

router.delete('/services/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.$queryRawUnsafe(`
      SELECT * FROM "ServicePackage" WHERE "id" = $1 LIMIT 1
    `, id);

    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    await prisma.$executeRawUnsafe(`
      DELETE FROM "ServicePackage" WHERE "id" = $1
    `, id);

    await logAudit(req, {
      action: 'SERVICE_PACKAGE_DELETE',
      targetType: 'SERVICE_PACKAGE',
      targetId: id,
      before: existing[0],
      reason: 'Admin deleted service package',
    });

    return res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete package' });
  }
});


router.get('/services/subscriptions', async (req, res) => {
  try {
    const subscriptions = await prisma.$queryRawUnsafe(`
      SELECT s.*, u."name" as "userName", u."email" as "userEmail", u."phone" as "userPhone",
             p."name" as "packageName", p."type" as "packageType"
      FROM "Subscription" s
      JOIN "User" u ON s."userId" = u."id"
      LEFT JOIN "ServicePackage" p ON s."packageId" = p."id"
      ORDER BY s."createdAt" DESC
    `);
    return res.json({ success: true, subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

router.patch('/services/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, extendDays, reason } = req.body;

    const subRows = await prisma.$queryRawUnsafe(`SELECT * FROM "Subscription" WHERE "id" = $1`, id);
    const existing = subRows[0];
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const updates = [];
    const params = [];
    let pIdx = 1;

    if (status) {
      updates.push(`"status" = $${pIdx++}`);
      params.push(status);
    }
    if (extendDays) {
      updates.push(`"expiryDate" = "expiryDate" + INTERVAL '${parseInt(extendDays, 10)} days'`);
    }

    if (updates.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(
        `UPDATE "Subscription" SET ${updates.join(', ')} WHERE "id" = $${pIdx}`,
        ...params
      );
    }

    await logAudit(req, {
      action: 'SUBSCRIPTION_UPDATE',
      targetType: 'SUBSCRIPTION',
      targetId: id,
      before: { status: existing.status, expiryDate: existing.expiryDate },
      after: { status, extendDays },
      reason: reason || 'Admin updated subscription status/extension',
    });

    return res.json({ success: true, message: 'Subscription updated' });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ success: false, message: 'Failed to update subscription' });
  }
});

// ==========================================
// 12. PAYMENTS, REFUNDS & INVOICES
// ==========================================
router.get('/payments', async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    let whereClauses = ['1=1'];
    let params = [];
    let pIdx = 1;

    if (type && type !== 'ALL') {
      whereClauses.push(`p."type" = $${pIdx++}`);
      params.push(type);
    }
    if (status && status !== 'ALL') {
      whereClauses.push(`p."status" = $${pIdx++}`);
      params.push(status);
    }

    const query = `
      SELECT p.*, u."name" as "userName", u."email" as "userEmail"
      FROM "Payment" p
      JOIN "User" u ON p."userId" = u."id"
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY p."createdAt" DESC
      LIMIT $${pIdx++} OFFSET $${pIdx}
    `;
    params.push(pageSize, offset);

    const [payments, totalResult, kpis] = await Promise.all([
      prisma.$queryRawUnsafe(query, ...params),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "Payment" p WHERE ${whereClauses.join(' AND ')}`, ...params.slice(0, pIdx - 2)),
      prisma.$queryRawUnsafe(`
        SELECT 
          COALESCE(SUM(CASE WHEN "status" = 'SUCCESS' THEN "amount" ELSE 0 END), 0)::float as "totalRevenue",
          COALESCE(SUM(CASE WHEN "status" = 'SUCCESS' AND "createdAt" >= CURRENT_DATE THEN "amount" ELSE 0 END), 0)::float as "todayRevenue",
          COALESCE(SUM(CASE WHEN "status" = 'SUCCESS' AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE) THEN "amount" ELSE 0 END), 0)::float as "monthlyRevenue",
          COUNT(CASE WHEN "status" = 'PENDING' THEN 1 END)::int as "pendingCount",
          COUNT(CASE WHEN "status" = 'FAILED' THEN 1 END)::int as "failedCount",
          COUNT(CASE WHEN "status" = 'REFUNDED' THEN 1 END)::int as "refundedCount"
        FROM "Payment"
      `),
    ]);

    return res.json({
      success: true,
      payments,
      kpis: kpis[0] || {},
      pagination: {
        total: totalResult[0]?.count || 0,
        page: pageNum,
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
});

router.get('/refunds', async (req, res) => {
  try {
    const refunds = await prisma.$queryRawUnsafe(`
      SELECT r.*, u."name" as "userName", u."email" as "userEmail", p."amount" as "paymentAmount", p."gateway" as "paymentGateway"
      FROM "Refund" r
      JOIN "User" u ON r."userId" = u."id"
      LEFT JOIN "Payment" p ON r."paymentId" = p."id"
      ORDER BY r."createdAt" DESC
    `);
    return res.json({ success: true, refunds });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch refunds' });
  }
});

router.post('/refunds', async (req, res) => {
  try {
    const { paymentId, userId, amount, reason, status = 'PROCESSED' } = req.body;
    if (!paymentId || !userId || !amount || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required refund fields' });
    }

    const refundId = 'ref-' + Date.now();
    const processedBy = req.staff.name;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Refund" ("id", "paymentId", "userId", "amount", "reason", "status", "processedBy", "processedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, refundId, paymentId, userId, parseFloat(amount), reason, status, processedBy);

    if (status === 'PROCESSED') {
      await prisma.$executeRawUnsafe(`UPDATE "Payment" SET "status" = 'REFUNDED' WHERE "id" = $1`, paymentId);
    }

    await logAudit(req, {
      action: 'PAYMENT_REFUND_ISSUED',
      targetType: 'REFUND',
      targetId: refundId,
      after: { paymentId, userId, amount, reason, status, processedBy },
      reason: reason || 'Administrative refund processed',
    });

    return res.status(201).json({ success: true, message: 'Refund recorded successfully', refundId });
  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
});

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await prisma.$queryRawUnsafe(`
      SELECT i.*, u."name" as "userName", u."email" as "userEmail", p."type" as "paymentType", p."gateway" as "paymentGateway"
      FROM "Invoice" i
      JOIN "User" u ON i."userId" = u."id"
      LEFT JOIN "Payment" p ON i."paymentId" = p."id"
      ORDER BY i."createdAt" DESC
    `);
    return res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
});

// ==========================================
// 13. SAFETY & TRUST CENTER
// ==========================================
router.get('/safety/reports', async (req, res) => {
  try {
    const reports = await prisma.$queryRawUnsafe(`
      SELECT r.*,
             u1."name" as "reporterName", u1."email" as "reporterEmail",
             u2."name" as "reportedUserName", u2."email" as "reportedUserEmail",
             e."title" as "reportedEventTitle"
      FROM "Report" r
      LEFT JOIN "User" u1 ON r."reporterId" = u1."id"
      LEFT JOIN "User" u2 ON r."reportedUserId" = u2."id"
      LEFT JOIN "Event" e ON r."reportedEventId" = e."id"
      ORDER BY r."createdAt" DESC
    `);
    return res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching safety reports:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch safety reports' });
  }
});

router.patch('/safety/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, internalNotes, actionToUser, reason } = req.body;

    const existingRows = await prisma.$queryRawUnsafe(`SELECT * FROM "Report" WHERE "id" = $1`, id);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const updates = [];
    const params = [];
    let pIdx = 1;

    if (status) {
      updates.push(`"status" = $${pIdx++}`);
      params.push(status);
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updates.push(`"resolvedBy" = $${pIdx++}, "resolvedAt" = NOW()`);
        params.push(req.staff.name);
      }
    }
    if (internalNotes) {
      updates.push(`"internalNotes" = $${pIdx++}`);
      params.push(internalNotes);
    }

    if (updates.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(`UPDATE "Report" SET ${updates.join(', ')} WHERE "id" = $${pIdx}`, ...params);
    }

    // Disciplinary action on reported user if requested
    if (actionToUser && existing.reportedUserId) {
      if (actionToUser === 'SUSPEND') {
        await prisma.$executeRawUnsafe(`UPDATE "User" SET "status" = 'SUSPENDED' WHERE "id" = $1`, existing.reportedUserId);
      } else if (actionToUser === 'BLOCK') {
        await prisma.$executeRawUnsafe(`UPDATE "User" SET "status" = 'BLOCKED' WHERE "id" = $1`, existing.reportedUserId);
      }
    }

    await logAudit(req, {
      action: 'SAFETY_REPORT_UPDATE',
      targetType: 'REPORT',
      targetId: id,
      before: { status: existing.status, internalNotes: existing.internalNotes },
      after: { status, internalNotes, actionToUser },
      reason: reason || 'Admin updated safety report status/action',
    });

    return res.json({ success: true, message: 'Report updated' });
  } catch (error) {
    console.error('Error updating report:', error);
    return res.status(500).json({ success: false, message: 'Failed to update report' });
  }
});

// ==========================================
// 14. VERIFICATION CENTER
// ==========================================
router.get('/verification', async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { in: ['MATCHMAKER', 'BREAKUP_BUDDY'] }, isApproved: false },
          { isVerified: false },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        isVerified: true,
        isApproved: true,
        govIdProof: true,
        addressProof: true,
        eduCertificate: true,
        workExperience: true,
        idType: true,
        idDocument: true,
        profilePhoto: true,
        profileImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ success: true, pendingUsers });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch verification list' });
  }
});

router.post('/verification/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved = true, notes } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isApproved: Boolean(approved),
        isVerified: Boolean(approved),
      },
    });

    await logAudit(req, {
      action: approved ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      targetType: 'USER',
      targetId: id,
      after: { isApproved: approved, isVerified: approved, notes },
      reason: notes || (approved ? 'Admin approved verification documentation' : 'Admin rejected verification'),
    });

    return res.json({
      success: true,
      message: approved ? 'Application approved successfully' : 'Application rejected',
    });
  } catch (error) {
    console.error('Error in verification action:', error);
    return res.status(500).json({ success: false, message: 'Failed to process verification' });
  }
});

// Legacy backward-compatible approval routes
router.get('/pending', async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        role: { in: ['MATCHMAKER', 'BREAKUP_BUDDY', 'HOST'] },
        isApproved: false,
      },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        govIdProof: true, addressProof: true, eduCertificate: true,
        workExperience: true, idType: true, idDocument: true,
        profilePhoto: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ success: true, data: pendingUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch pending applications' });
  }
});

router.post('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { isApproved: true, isVerified: true },
    });
    await logAudit(req, {
      action: 'APPROVE_APPLICATION',
      targetType: 'USER',
      targetId: id,
      reason: 'Legacy approve endpoint invoked',
    });
    return res.json({ success: true, message: 'Application approved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to approve application' });
  }
});

// ==========================================
// 15. REVIEWS & RATINGS MODERATION
// ==========================================
router.get('/reviews', async (req, res) => {
  try {
    const buddyReviews = await prisma.buddyReview.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        buddy: { select: { id: true, name: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, reviews: buddyReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// ==========================================
// 16. SUPPORT CENTER
// ==========================================
router.get('/support', async (req, res) => {
  try {
    const tickets = await prisma.$queryRawUnsafe(`
      SELECT t.*, u."name" as "userName", u."email" as "userEmail", u."phone" as "userPhone"
      FROM "SupportTicket" t
      JOIN "User" u ON t."userId" = u."id"
      ORDER BY t."createdAt" DESC
    `);
    return res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch support tickets' });
  }
});

router.post('/support/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }

    const ticketRows = await prisma.$queryRawUnsafe(`SELECT * FROM "SupportTicket" WHERE "id" = $1`, id);
    const ticket = ticketRows[0];
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let existingReplies = [];
    try {
      existingReplies = typeof ticket.replies === 'string' ? JSON.parse(ticket.replies) : (ticket.replies || []);
    } catch (e) {}

    existingReplies.push({
      author: req.staff.name,
      role: 'Staff',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    });

    const newStatus = status || 'WAITING_FOR_USER';

    await prisma.$executeRawUnsafe(`
      UPDATE "SupportTicket"
      SET "replies" = $1::jsonb, "status" = $2, "updatedAt" = NOW()
      WHERE "id" = $3
    `, JSON.stringify(existingReplies), newStatus, id);

    await logAudit(req, {
      action: 'SUPPORT_TICKET_REPLY',
      targetType: 'SUPPORT_TICKET',
      targetId: id,
      after: { newStatus, messageSnippet: message.substring(0, 100) },
      reason: 'Staff replied to customer support ticket',
    });

    return res.json({ success: true, message: 'Reply sent successfully', replies: existingReplies, status: newStatus });
  } catch (error) {
    console.error('Error replying to support ticket:', error);
    return res.status(500).json({ success: false, message: 'Failed to reply to support ticket' });
  }
});

router.patch('/support/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedStaffId, priority } = req.body;

    const updates = [];
    const params = [];
    let pIdx = 1;

    if (status) {
      updates.push(`"status" = $${pIdx++}`);
      params.push(status);
    }
    if (assignedStaffId !== undefined) {
      updates.push(`"assignedStaffId" = $${pIdx++}`);
      params.push(assignedStaffId);
    }
    if (priority) {
      updates.push(`"priority" = $${pIdx++}`);
      params.push(priority);
    }

    if (updates.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(
        `UPDATE "SupportTicket" SET ${updates.join(', ')}, "updatedAt" = NOW() WHERE "id" = $${pIdx}`,
        ...params
      );
    }

    return res.json({ success: true, message: 'Ticket status updated' });
  } catch (error) {
    console.error('Error updating support ticket status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update ticket status' });
  }
});

// ==========================================
// 17. NOTIFICATIONS & ANNOUNCEMENTS
// ==========================================
router.get('/notifications', async (req, res) => {
  try {
    const announcements = await prisma.$queryRawUnsafe(`
      SELECT * FROM "NotificationAnnouncement" ORDER BY "sentAt" DESC
    `);
    return res.json({ success: true, announcements });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const { title, message, type = 'ANNOUNCEMENT', targetAudience = 'All Users' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const annId = 'notif-' + Date.now();
    let recipientCount = 0;
    if (targetAudience === 'Upcoming Event Attendees' || targetAudience === 'Event Attendees') {
      const resCount = await prisma.$queryRawUnsafe(`SELECT COUNT(DISTINCT "userId")::int as count FROM "EventRegistration"`);
      recipientCount = resCount[0]?.count || 0;
    } else if (targetAudience === 'Relationship Manager Clients' || targetAudience === 'RM Subscribers') {
      const resCount = await prisma.$queryRawUnsafe(`SELECT COUNT(DISTINCT "userId")::int as count FROM "Subscription" WHERE "status" = 'ACTIVE' AND "serviceType" = 'RELATIONSHIP_MANAGER'`);
      recipientCount = resCount[0]?.count || 0;
    } else if (targetAudience === 'Breakup Buddy Circles' || targetAudience === 'Buddy Subscribers') {
      const resCount = await prisma.$queryRawUnsafe(`SELECT COUNT(DISTINCT "userId")::int as count FROM "Subscription" WHERE "status" = 'ACTIVE' AND "serviceType" = 'BREAKUP_BUDDY'`);
      recipientCount = resCount[0]?.count || 0;
    } else {
      const resCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "User" WHERE COALESCE("status", 'ACTIVE') = 'ACTIVE'`);
      recipientCount = resCount[0]?.count || 0;
    }

    if (recipientCount === 0) {
      const resFallback = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "User" WHERE COALESCE("status", 'ACTIVE') = 'ACTIVE'`);
      recipientCount = resFallback[0]?.count || 0;
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "NotificationAnnouncement" ("id", "title", "message", "type", "targetAudience", "sentBy", "recipientCount", "sentAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, annId, title, message, type, targetAudience, req.staff.name, recipientCount);

    await logAudit(req, {
      action: 'PLATFORM_ANNOUNCEMENT_BROADCAST',
      targetType: 'NOTIFICATION',
      targetId: annId,
      after: { title, type, targetAudience, recipientCount },
      reason: 'Admin broadcast platform announcement',
    });

    return res.status(201).json({ success: true, message: `Announcement broadcasted to ${recipientCount} recipients`, annId });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return res.status(500).json({ success: false, message: 'Failed to broadcast notification' });
  }
});

// ==========================================
// 18. CONTENT MANAGEMENT (CMS)
// ==========================================
router.get('/content', async (req, res) => {
  try {
    const cmsSetting = await prisma.$queryRawUnsafe(`
      SELECT "value" FROM "SystemSetting" WHERE "key" = 'platform_cms' LIMIT 1
    `);
    const content = cmsSetting[0]?.value || {};
    return res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching CMS content:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch content' });
  }
});

router.patch('/content', async (req, res) => {
  try {
    const { content, reason } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content payload required' });
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "SystemSetting" ("key", "category", "value", "updatedBy", "updatedAt")
      VALUES ('platform_cms', 'content', $1::jsonb, $2, NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = $1::jsonb, "updatedBy" = $2, "updatedAt" = NOW()
    `, JSON.stringify(content), req.staff.name);

    await logAudit(req, {
      action: 'CONTENT_CMS_UPDATE',
      targetType: 'CMS',
      targetId: 'platform_cms',
      after: content,
      reason: reason || 'Admin updated public platform content',
    });

    return res.json({ success: true, message: 'Platform content updated successfully' });
  } catch (error) {
    console.error('Error updating CMS content:', error);
    return res.status(500).json({ success: false, message: 'Failed to update content' });
  }
});

// ==========================================
// 19. COUPONS & OFFERS
// ==========================================
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Coupon" ORDER BY "createdAt" DESC
    `);
    return res.json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, discountType = 'PERCENTAGE', discountAmount, applicableService = 'ALL', minOrderAmount = 0, maxUses = 100, perUserLimit = 1, expiryDate } = req.body;
    if (!code || discountAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount amount required' });
    }

    const couponId = 'cpn-' + Date.now();
    const cleanCode = code.trim().toUpperCase();

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Coupon" ("id", "code", "discountType", "discountAmount", "applicableService", "minOrderAmount", "maxUses", "usedCount", "perUserLimit", "startDate", "expiryDate", "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, NOW(), $9, true)
    `, couponId, cleanCode, discountType, parseFloat(discountAmount), applicableService, parseFloat(minOrderAmount), parseInt(maxUses, 10), parseInt(perUserLimit, 10), expiryDate ? new Date(expiryDate) : null);

    await logAudit(req, {
      action: 'COUPON_CREATE',
      targetType: 'COUPON',
      targetId: couponId,
      after: { code: cleanCode, discountType, discountAmount },
      reason: 'Admin created discount coupon',
    });

    return res.status(201).json({ success: true, message: 'Coupon created successfully', couponId });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
});

router.patch('/coupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, discountAmount, maxUses, expiryDate } = req.body;

    const updates = [];
    const params = [];
    let pIdx = 1;

    if (isActive !== undefined) {
      updates.push(`"isActive" = $${pIdx++}`);
      params.push(Boolean(isActive));
    }
    if (discountAmount !== undefined) {
      updates.push(`"discountAmount" = $${pIdx++}`);
      params.push(parseFloat(discountAmount));
    }
    if (maxUses !== undefined) {
      updates.push(`"maxUses" = $${pIdx++}`);
      params.push(parseInt(maxUses, 10));
    }
    if (expiryDate !== undefined) {
      updates.push(`"expiryDate" = $${pIdx++}`);
      params.push(expiryDate ? new Date(expiryDate) : null);
    }

    if (updates.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(`UPDATE "Coupon" SET ${updates.join(', ')} WHERE "id" = $${pIdx}`, ...params);
    }

    return res.json({ success: true, message: 'Coupon updated' });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
});

// ==========================================
// 20. STAFF & PERMISSION MANAGEMENT
// ==========================================
router.get('/staff', async (req, res) => {
  try {
    const staffMembers = await prisma.$queryRawUnsafe(`
      SELECT "id", "name", "email", "phone", "role", COALESCE("staffRole", 'SUPER_ADMIN') as "staffRole",
             COALESCE("status", 'ACTIVE') as "status", "createdAt", "lastActiveAt"
      FROM "User"
      WHERE "role" = 'ADMIN'
      ORDER BY "createdAt" ASC
    `);
    return res.json({ success: true, staffMembers });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff members' });
  }
});

router.patch('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { staffRole, status, reason } = req.body;

    const existingRows = await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE "id" = $1 AND "role" = 'ADMIN'`, id);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const updates = [];
    const params = [];
    let pIdx = 1;

    if (status) {
      updates.push(`"status" = $${pIdx++}`);
      params.push(status);
    }
    // Always ensure SUPER_ADMIN
    updates.push(`"staffRole" = $${pIdx++}`);
    params.push('SUPER_ADMIN');

    if (updates.length > 0) {
      params.push(id);
      await prisma.$executeRawUnsafe(`UPDATE "User" SET ${updates.join(', ')}, "updatedAt" = NOW() WHERE "id" = $${pIdx}`, ...params);
    }

    await logAudit(req, {
      action: 'ADMIN_STATUS_UPDATE',
      targetType: 'STAFF',
      targetId: id,
      before: { staffRole: 'SUPER_ADMIN', status: existing.status },
      after: { staffRole: 'SUPER_ADMIN', status: status || existing.status },
      reason: reason || 'Admin account status updated by Super Admin',
    });

    return res.json({ success: true, message: 'Super Admin account updated' });
  } catch (error) {
    console.error('Error updating staff member:', error);
    return res.status(500).json({ success: false, message: 'Failed to update staff member' });
  }
});

// ==========================================
// 21. AUDIT LOGS (IMMUTABLE)
// ==========================================
router.get('/audit-logs', async (req, res) => {
  try {
    const { targetType, action, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * pageSize;

    let whereClauses = ['1=1'];
    let params = [];
    let pIdx = 1;

    if (targetType && targetType !== 'ALL') {
      whereClauses.push(`"targetType" = $${pIdx++}`);
      params.push(targetType);
    }
    if (action) {
      whereClauses.push(`LOWER("action") LIKE $${pIdx++}`);
      params.push(`%${action.trim().toLowerCase()}%`);
    }

    const query = `
      SELECT * FROM "AuditLog"
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY "createdAt" DESC
      LIMIT $${pIdx++} OFFSET $${pIdx}
    `;
    params.push(pageSize, offset);

    const [logs, totalResult] = await Promise.all([
      prisma.$queryRawUnsafe(query, ...params),
      prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "AuditLog" WHERE ${whereClauses.join(' AND ')}`, ...params.slice(0, pIdx - 2)),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        total: totalResult[0]?.count || 0,
        page: pageNum,
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

// ==========================================
// 22. SYSTEM SETTINGS
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.$queryRawUnsafe(`
      SELECT * FROM "SystemSetting" ORDER BY "category", "key" ASC
    `);

    const grouped = {};
    settings.forEach(s => {
      grouped[s.key] = s.value;
    });

    return res.json({ success: true, settings: grouped });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    const { key, category, value, reason } = req.body;
    if (!key || !value) {
      return res.status(400).json({ success: false, message: 'Setting key and value required' });
    }

    // Protect against setting any secrets via UI
    const protectedKeys = ['jwt_secret', 'database_url', 'api_key', 'razorpay_secret'];
    if (protectedKeys.includes(key.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Environment secrets cannot be modified via UI' });
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "SystemSetting" ("key", "category", "value", "updatedBy", "updatedAt")
      VALUES ($1, $2, $3::jsonb, $4, NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = $3::jsonb, "updatedBy" = $4, "updatedAt" = NOW()
    `, key, category || 'general', JSON.stringify(value), req.staff.name);

    await logAudit(req, {
      action: 'SYSTEM_SETTING_UPDATE',
      targetType: 'SYSTEM_SETTING',
      targetId: key,
      after: value,
      reason: reason || `Updated system setting ${key}`,
    });

    return res.json({ success: true, message: 'Setting saved successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
});

// Fetch Admin Earnings (10% of Dating Packages)
router.get('/earnings', async (req, res) => {
  try {
    const packages = await prisma.$queryRawUnsafe(`
      SELECT p.*, u."name" as "userName", u."email" as "userEmail"
      FROM "Payment" p
      JOIN "User" u ON p."userId" = u."id"
      WHERE p."type" = 'DATING_PACKAGE' AND p."status" = 'SUCCESS'
      ORDER BY p."createdAt" DESC
    `);
    
    // Map to 10% cut
    const earnings = packages.map(pkg => ({
      id: pkg.id,
      createdAt: pkg.createdAt,
      sourceAmount: pkg.amount,
      amount: pkg.amount * 0.10, // 10% cut
      userName: pkg.userName,
      userEmail: pkg.userEmail,
      type: 'Admin Revenue Share (10%)'
    }));

    const totalEarned = earnings.reduce((sum, e) => sum + e.amount, 0);

    res.json({ success: true, earnings, totalEarned });
  } catch (error) {
    console.error('Error fetching admin earnings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin earnings' });
  }
});

module.exports = router;
