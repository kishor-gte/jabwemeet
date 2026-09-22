const express = require('express');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { logAudit } = require('../services/auditLogger');
const {
  sendTestEmail,
  sendBuddyApprovedEmail,
  sendBuddyRejectedEmail,
  sendBuddyRevokedEmail,
  sendUserVerificationApprovedEmail,
  sendUserVerificationRejectedEmail,
  sendUserStatusUpdatedEmail,
  sendRMApprovedEmail,
  sendRMRejectedEmail,
  sendRMRevokedEmail,
  sendHostApprovedEmail,
  sendHostRejectedEmail,
  sendHostRevokedEmail,
  sendEventPublishedEmail,
  sendEventCancelledOrUpdatedEmail,
  sendEventTicketResendEmail,
  sendRefundProcessedEmail,
  sendInvoiceEmail,
  sendSupportTicketReplyEmail,
  sendSupportTicketResolvedEmail,
  sendHighPriorityTicketAdminAlert,
  sendSafetyReportResolvedEmail,
  sendUserSafetyWarningEmail,
  sendBroadcastAnnouncementEmail,
  sendCouponPromoEmail,
} = require('../utils/mailer');

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

      // Trigger Email Notifications
      if (existingUser.email) {
        // 1. Account Status (ACTIVE, SUSPENDED, BLOCKED)
        if (status && status !== existingUser.status) {
          sendUserStatusUpdatedEmail({
            userEmail: existingUser.email,
            userName: existingUser.name,
            status,
            reason,
          }).catch(err => console.warn('User status email note:', err.message));
        }

        // 2. Verification status change
        if (isVerified !== undefined && isVerified !== existingUser.isVerified) {
          if (Boolean(isVerified)) {
            sendUserVerificationApprovedEmail({
              userEmail: existingUser.email,
              userName: existingUser.name,
            }).catch(err => console.warn('Verification email note:', err.message));
          } else {
            sendUserVerificationRejectedEmail({
              userEmail: existingUser.email,
              userName: existingUser.name,
              reason: reason || 'Verification status changed by Administrator',
            }).catch(err => console.warn('Verification rejection note:', err.message));
          }
        }
      }
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

      // Email Trigger 1: Host Published Notification
      if (body.status === 'PUBLISHED' && existingEvent.status !== 'PUBLISHED' && existingEvent.hostId) {
        try {
          const host = await prisma.user.findUnique({ where: { id: existingEvent.hostId } });
          if (host && host.email) {
            sendEventPublishedEmail({
              hostEmail: host.email,
              hostName: host.name,
              eventTitle: existingEvent.title,
              eventDate: existingEvent.date,
              eventCity: existingEvent.city,
            });
          }
        } catch (mailErr) {
          console.warn('Host event live mail note:', mailErr.message);
        }
      }

      // Email Trigger 2: Attendee Cancellation / Reschedule Alert
      if (body.status === 'CANCELLED' || (body.date && new Date(body.date).getTime() !== new Date(existingEvent.date).getTime())) {
        try {
          const attendees = await prisma.$queryRawUnsafe(`
            SELECT u."email", u."name"
            FROM "EventRegistration" er
            JOIN "User" u ON er."userId" = u."id"
            WHERE er."eventId" = $1 AND er."status" != 'CANCELLED'
          `, id);

          for (const att of attendees) {
            if (att.email) {
              sendEventCancelledOrUpdatedEmail({
                attendeeEmail: att.email,
                attendeeName: att.name,
                eventTitle: existingEvent.title,
                eventDate: body.date || existingEvent.date,
                status: body.status || 'RESCHEDULED',
                reason: body.reason || 'Event schedule updated by Administration',
              }).catch(e => {});
            }
          }
        } catch (attErr) {
          console.warn('Attendees update mail note:', attErr.message);
        }
      }
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

    // Notify registered attendees about event cancellation/archive
    try {
      const attendees = await prisma.$queryRawUnsafe(`
        SELECT u."email", u."name"
        FROM "EventRegistration" er
        JOIN "User" u ON er."userId" = u."id"
        WHERE er."eventId" = $1 AND er."status" != 'CANCELLED'
      `, id);

      for (const att of attendees) {
        if (att.email) {
          sendEventCancelledOrUpdatedEmail({
            attendeeEmail: att.email,
            attendeeName: att.name,
            eventTitle: existing.title,
            eventDate: existing.date,
            status: 'CANCELLED',
            reason: 'Event has been archived/cancelled by platform administration.',
          }).catch(e => {});
        }
      }
    } catch (mailErr) {
      console.warn('Cancel mail error:', mailErr.message);
    }

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

// Resend Ticket Pass to Attendee
router.post('/events/:id/registrations/:regId/resend', async (req, res) => {
  try {
    const { id, regId } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const rows = await prisma.$queryRawUnsafe(`
      SELECT er.*, u."email", u."name"
      FROM "EventRegistration" er
      JOIN "User" u ON er."userId" = u."id"
      WHERE er."id" = $1 AND er."eventId" = $2
    `, regId, id);

    const reg = rows[0];
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });

    if (reg.email) {
      await sendEventTicketResendEmail({
        attendeeEmail: reg.email,
        attendeeName: reg.name,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location || event.address || event.city,
        ticketCode: reg.ticketCode,
        qrCode: reg.qrCode,
      });
    }

    return res.json({ success: true, message: `Ticket pass resent successfully to ${reg.email}` });
  } catch (error) {
    console.error('Error resending ticket pass:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend ticket pass' });
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

router.patch('/event-managers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, status, reason } = req.body;

    const host = await prisma.user.findUnique({ where: { id } });
    if (!host) {
      return res.status(404).json({ success: false, message: 'Event Host not found' });
    }

    if (isApproved !== undefined) {
      const willApprove = Boolean(isApproved);
      await prisma.user.update({ where: { id }, data: { isApproved: willApprove, isVerified: willApprove } });

      if (host.email) {
        if (willApprove) {
          sendHostApprovedEmail({ email: host.email, name: host.name }).catch(err => console.warn('Host approval email note:', err.message));
        } else if (host.isApproved) {
          sendHostRevokedEmail({ email: host.email, name: host.name, reason }).catch(err => console.warn('Host revocation email note:', err.message));
        } else {
          sendHostRejectedEmail({ email: host.email, name: host.name, reason }).catch(err => console.warn('Host rejection email note:', err.message));
        }
      }
    }
    if (status !== undefined) {
      await prisma.$executeRawUnsafe(`UPDATE "User" SET "status" = $1 WHERE "id" = $2`, status, id);
    }

    await logAudit(req, {
      action: 'EVENT_HOST_UPDATE',
      targetType: 'USER',
      targetId: id,
      before: { isApproved: host.isApproved },
      after: { isApproved, status },
      reason: reason || 'Admin updated Event Host status',
    });

    return res.json({ success: true, message: 'Event Host updated successfully' });
  } catch (error) {
    console.error('Error updating event host:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event host' });
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
      const willApprove = Boolean(isApproved);
      await prisma.user.update({ where: { id }, data: { isApproved: willApprove, isVerified: willApprove } });

      if (manager.email) {
        if (willApprove) {
          sendRMApprovedEmail({ email: manager.email, name: manager.name }).catch(err => console.warn('RM approval email note:', err.message));
        } else if (manager.isApproved) {
          sendRMRevokedEmail({ email: manager.email, name: manager.name, reason }).catch(err => console.warn('RM revocation email note:', err.message));
        } else {
          sendRMRejectedEmail({ email: manager.email, name: manager.name, reason }).catch(err => console.warn('RM rejection email note:', err.message));
        }
      }
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
    if (isApproved !== undefined) {
      const willApprove = Boolean(isApproved);
      updateData.isApproved = willApprove;
      // Trigger approval/rejection/revocation email to the Breakup Buddy
      try {
        if (willApprove) {
          sendBuddyApprovedEmail({
            buddyEmail: buddy.email,
            buddyName: buddy.displayName || buddy.name,
          });
        } else if (buddy.isApproved) {
          sendBuddyRevokedEmail({
            buddyEmail: buddy.email,
            buddyName: buddy.displayName || buddy.name,
            reason,
          });
        } else {
          sendBuddyRejectedEmail({
            buddyEmail: buddy.email,
            buddyName: buddy.displayName || buddy.name,
            reason: reason || 'Application status updated by Admin',
          });
        }
      } catch (mailErr) {
        console.warn('Mail dispatch note:', mailErr.message);
      }
    }
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
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 1. Fetch dates from MatchSuggestion (where meetingDate IS NOT NULL OR status IN ('DateFixed', 'Ongoing', 'Completed', 'Done', 'Scheduled'))
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        OR: [
          { meetingDate: { not: null } },
          { status: { in: ['DateFixed', 'Ongoing', 'Completed', 'Done', 'Scheduled'] } }
        ]
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true, profileImage: true, gender: true, city: true }
        },
        suggestedProfile: {
          select: { id: true, name: true, email: true, phone: true, profileImage: true, gender: true, city: true }
        },
        matchmaker: {
          select: { id: true, name: true, email: true, phone: true }
        },
      },
      orderBy: [
        { meetingDate: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    // 2. Fetch appointments
    const appointments = await prisma.appointment.findMany({
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, profileImage: true, gender: true, city: true } },
        matchmaker: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Format MatchSuggestion dates
    const formattedSuggestions = suggestions.map((s) => {
      const meetDate = s.meetingDate ? new Date(s.meetingDate) : new Date(s.updatedAt);
      const isPast = meetDate.getTime() < todayStart.getTime();
      const isToday = meetDate >= todayStart && meetDate <= todayEnd;

      let computedStatus = 'Scheduled';
      if (s.status === 'Completed' || s.status === 'Done') {
        computedStatus = 'Done';
      } else if (s.status === 'Cancelled' || s.status === 'Rejected') {
        computedStatus = 'Cancelled';
      } else if (s.status === 'Ongoing' || isToday) {
        computedStatus = 'Ongoing';
      } else if (isPast) {
        computedStatus = 'Done';
      } else {
        computedStatus = 'Scheduled';
      }

      return {
        id: s.id,
        source: 'MATCH_SUGGESTION',
        client: s.client,
        partner: s.suggestedProfile,
        matchmaker: s.matchmaker,
        date: s.meetingDate || s.updatedAt,
        time: s.meetingDate
          ? new Date(s.meetingDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
          : 'TBD',
        mode: s.meetingVenue ? 'Venue Table' : 'Curated Date',
        venue: s.meetingVenue || 'Venue Table',
        location: s.meetingLocation || s.client?.city || 'City Center',
        message: s.meetingMessage || 'Curated match date',
        status: computedStatus,
        rawStatus: s.status,
        clientStatus: s.clientStatus,
        suggestedStatus: s.suggestedStatus,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });

    // Format Appointment dates
    const formattedAppointments = appointments.map((a) => {
      const appDate = new Date(a.date);
      const isPast = appDate.getTime() < todayStart.getTime();
      const isToday = appDate >= todayStart && appDate <= todayEnd;

      let computedStatus = 'Scheduled';
      if (a.status === 'Completed' || a.status === 'Done') {
        computedStatus = 'Done';
      } else if (a.status === 'Cancelled' || a.status === 'Rejected') {
        computedStatus = 'Cancelled';
      } else if (a.status === 'Ongoing' || isToday) {
        computedStatus = 'Ongoing';
      } else if (isPast) {
        computedStatus = 'Done';
      } else {
        computedStatus = a.status || 'Scheduled';
      }

      return {
        id: a.id,
        source: 'APPOINTMENT',
        client: a.client,
        partner: null,
        matchmaker: a.matchmaker,
        date: a.date,
        time: a.time,
        mode: a.mode || a.type || 'Consultation',
        venue: a.type || 'Matchmaker Desk',
        location: a.client?.city || 'Online / Center',
        message: 'Direct Matchmaker Appointment',
        status: computedStatus,
        rawStatus: a.status,
        createdAt: a.createdAt,
        updatedAt: a.createdAt,
      };
    });

    const allDates = [...formattedSuggestions, ...formattedAppointments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return res.json({
      success: true,
      dates: allDates,
      counts: {
        all: allDates.length,
        ongoing: allDates.filter(d => d.status === 'Ongoing').length,
        done: allDates.filter(d => d.status === 'Done').length,
        scheduled: allDates.filter(d => d.status === 'Scheduled').length,
        cancelled: allDates.filter(d => d.status === 'Cancelled').length,
      }
    });
  } catch (error) {
    console.error('Error fetching dates:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch scheduled dates' });
  }
});

router.patch('/dates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, time, venue, location, reason } = req.body;

    const suggestion = await prisma.matchSuggestion.findUnique({ where: { id } });
    if (suggestion) {
      const updateData = {};
      if (status) {
        if (status === 'Done' || status === 'Completed') updateData.status = 'Completed';
        else if (status === 'Ongoing') updateData.status = 'Ongoing';
        else if (status === 'Cancelled') updateData.status = 'Cancelled';
        else updateData.status = status;
      }
      if (date) {
        let newDate = new Date(date);
        if (time) {
          const parts = String(time).match(/(\d+):(\d+)/);
          if (parts) {
            newDate.setHours(parseInt(parts[1], 10), parseInt(parts[2], 10));
          }
        }
        updateData.meetingDate = newDate;
      }
      if (venue) updateData.meetingVenue = venue;
      if (location) updateData.meetingLocation = location;

      await prisma.matchSuggestion.update({
        where: { id },
        data: updateData,
      });

      await logAudit(req, {
        action: 'DATE_SCHEDULE_UPDATE',
        targetType: 'MATCH_SUGGESTION',
        targetId: id,
        before: suggestion,
        after: updateData,
        reason: reason || 'Date schedule updated by admin',
      });

      return res.json({ success: true, message: 'Date schedule updated' });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (appointment) {
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
    }

    return res.status(404).json({ success: false, message: 'Date record not found' });
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
    const { type, name, price, billingCycle = 'MONTHLY', durationDays = 30, durationHours = 0, durationMinutes = 0, sessionLimit = 0, callLimit = 0, chatLimit = 0, description = '', features = [] } = req.body;
    if (!type || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Package type, name and price are required' });
    }

    const packageId = 'pkg-' + Date.now();

    await prisma.$executeRawUnsafe(`
      INSERT INTO "ServicePackage" ("id", "type", "name", "price", "billingCycle", "durationDays", "durationHours", "durationMinutes", "sessionLimit", "callLimit", "chatLimit", "description", "features", "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, true)
    `, packageId, type, name, parseFloat(price), billingCycle, parseInt(durationDays, 10) || 0, parseInt(durationHours, 10) || 0, parseInt(durationMinutes, 10) || 0, parseInt(sessionLimit, 10) || 0, parseInt(callLimit, 10) || 0, parseInt(chatLimit, 10) || 0, description, JSON.stringify(features));

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
    if (body.durationHours !== undefined) {
      updates.push(`"durationHours" = $${pIdx++}`);
      params.push(parseInt(body.durationHours, 10));
    }
    if (body.durationMinutes !== undefined) {
      updates.push(`"durationMinutes" = $${pIdx++}`);
      params.push(parseInt(body.durationMinutes, 10));
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
    // 1. Fetch general service subscriptions
    let generalSubs = [];
    try {
      generalSubs = await prisma.$queryRawUnsafe(`
        SELECT s.*, u."name" as "userName", u."email" as "userEmail", u."phone" as "userPhone",
               p."name" as "packageName", p."type" as "packageType", p."sessionLimit" as "sessionLimit"
        FROM "Subscription" s
        JOIN "User" u ON s."userId" = u."id"
        LEFT JOIN "ServicePackage" p ON s."packageId" = p."id"
        ORDER BY s."createdAt" DESC
      `);
    } catch (e) {
      console.warn("Notice querying Subscription table:", e.message);
    }

    // 2. Fetch Host subscriptions (excluding free starter plans with 0 amount)
    let hostSubs = [];
    try {
      hostSubs = await prisma.hostSubscription.findMany({
        where: {
          OR: [
            { amountPaid: { gt: 0 } },
            { plan: { not: 'STARTER' } }
          ]
        },
        include: {
          host: {
            select: { id: true, name: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      console.warn("Notice querying HostSubscription table:", e.message);
    }

    // Map and merge host subscriptions not already represented in generalSubs
    const existingSubIds = new Set((generalSubs || []).map(s => s.id));
    const formattedHostSubs = hostSubs
      .filter(hs => !existingSubIds.has(hs.id) && !existingSubIds.has(`sub_host_${hs.id}`))
      .map(hs => ({
        id: hs.id,
        userId: hs.hostId,
        userName: hs.host?.name || 'Host Member',
        userEmail: hs.host?.email || '',
        userPhone: hs.host?.phone || '',
        packageName: hs.plan,
        packageType: 'HOST',
        serviceType: 'HOST_SUBSCRIPTION',
        amount: hs.amountPaid,
        billingCycle: 'MONTHLY',
        status: hs.status,
        startDate: hs.createdAt,
        expiryDate: hs.expiresAt,
        maxEvents: hs.maxEvents,
        eventsUsed: hs.eventsUsed,
        createdAt: hs.createdAt,
      }));

    const combined = [...(generalSubs || []), ...formattedHostSubs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json({ success: true, subscriptions: combined });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
});

router.patch('/services/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, extendDays, reason } = req.body;

    const subRows = await prisma.$queryRawUnsafe(`SELECT * FROM "Subscription" WHERE "id" = $1`, id).catch(() => []);
    const existing = subRows && subRows[0];

    // Check host subscription if applicable
    const cleanHostId = id.startsWith('sub_host_') ? id.replace('sub_host_', '') : id;
    const existingHostSub = await prisma.hostSubscription.findFirst({
      where: { OR: [{ id }, { id: cleanHostId }] }
    }).catch(() => null);

    if (!existing && !existingHostSub) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Update central Subscription record if present
    if (existing) {
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
    }

    // Update HostSubscription record if present
    if (existingHostSub) {
      const updateData = {};
      if (status) updateData.status = status;
      if (extendDays) {
        const newExpiry = new Date(existingHostSub.expiresAt);
        newExpiry.setDate(newExpiry.getDate() + parseInt(extendDays, 10));
        updateData.expiresAt = newExpiry;
      }
      await prisma.hostSubscription.update({
        where: { id: existingHostSub.id },
        data: updateData,
      });
    }

    await logAudit(req, {
      action: 'SUBSCRIPTION_UPDATE',
      targetType: 'SUBSCRIPTION',
      targetId: id,
      before: {
        status: existing?.status || existingHostSub?.status,
        expiryDate: existing?.expiryDate || existingHostSub?.expiresAt,
      },
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

      // Trigger Refund Confirmation Email to user
      try {
        const [user, payRows] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
          prisma.$queryRawUnsafe(`SELECT "referenceId" FROM "Payment" WHERE "id" = $1`, paymentId)
        ]);
        if (user && user.email) {
          sendRefundProcessedEmail({
            userEmail: user.email,
            userName: user.name,
            amount: parseFloat(amount),
            refundId,
            referenceId: payRows[0]?.referenceId || paymentId,
            reason,
          }).catch(err => console.warn('Refund email note:', err.message));
        }
      } catch (mailErr) {
        console.warn('Refund mail error:', mailErr.message);
      }
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

// Send Invoice Email to Customer
router.post('/invoices/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const invRows = await prisma.$queryRawUnsafe(`
      SELECT i.*, u."name" as "userName", u."email" as "userEmail", p."type" as "paymentType", p."gateway" as "paymentGateway"
      FROM "Invoice" i
      JOIN "User" u ON i."userId" = u."id"
      LEFT JOIN "Payment" p ON i."paymentId" = p."id"
      WHERE i."id" = $1
    `, id);

    const invoice = invRows[0];
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (invoice.userEmail) {
      await sendInvoiceEmail({
        userEmail: invoice.userEmail,
        userName: invoice.userName,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        paymentType: invoice.paymentType,
        gateway: invoice.paymentGateway,
        date: invoice.createdAt,
      });
    }

    return res.json({ success: true, message: `Invoice sent to ${invoice.userEmail}` });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return res.status(500).json({ success: false, message: 'Failed to send invoice' });
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

    const existingRows = await prisma.$queryRawUnsafe(`
      SELECT r.*, u1."email" as "reporterEmail", u1."name" as "reporterName",
             u2."email" as "reportedUserEmail", u2."name" as "reportedUserName"
      FROM "Report" r
      LEFT JOIN "User" u1 ON r."reporterId" = u1."id"
      LEFT JOIN "User" u2 ON r."reportedUserId" = u2."id"
      WHERE r."id" = $1
    `, id);
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

      // Send warning/disciplinary notice email to reported user
      if (existing.reportedUserEmail) {
        sendUserSafetyWarningEmail({
          userEmail: existing.reportedUserEmail,
          userName: existing.reportedUserName,
          reason: reason || `Administrative action taken (${actionToUser}) regarding platform safety violations.`,
        }).catch(e => {});
      }
    }

    // Send update email to reporter
    if ((status === 'RESOLVED' || status === 'CLOSED') && existing.reporterEmail) {
      sendSafetyReportResolvedEmail({
        reporterEmail: existing.reporterEmail,
        reporterName: existing.reporterName,
        reportCategory: existing.category,
        actionTaken: actionToUser ? `Action taken on reported account (${actionToUser})` : 'Appropriate administrative action enforced.',
      }).catch(e => {});
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

    if (user.email) {
      try {
        if (user.role === 'BREAKUP_BUDDY') {
          if (approved) {
            sendBuddyApprovedEmail({ buddyEmail: user.email, buddyName: user.displayName || user.name });
          } else if (user.isApproved) {
            sendBuddyRevokedEmail({ buddyEmail: user.email, buddyName: user.displayName || user.name, reason: notes });
          } else {
            sendBuddyRejectedEmail({ buddyEmail: user.email, buddyName: user.displayName || user.name, reason: notes || 'Verification rejected by Admin' });
          }
        } else if (user.role === 'MATCHMAKER') {
          if (approved) {
            sendRMApprovedEmail({ email: user.email, name: user.name });
          } else if (user.isApproved) {
            sendRMRevokedEmail({ email: user.email, name: user.name, reason: notes });
          } else {
            sendRMRejectedEmail({ email: user.email, name: user.name, reason: notes || 'Matchmaker application rejected by Admin' });
          }
        } else if (user.role === 'HOST' || user.role === 'EVENT_MANAGER') {
          if (approved) {
            sendHostApprovedEmail({ email: user.email, name: user.name });
          } else if (user.isApproved) {
            sendHostRevokedEmail({ email: user.email, name: user.name, reason: notes });
          } else {
            sendHostRejectedEmail({ email: user.email, name: user.name, reason: notes || 'Event host application rejected by Admin' });
          }
        } else {
          // General Member
          if (approved) {
            sendUserVerificationApprovedEmail({ userEmail: user.email, userName: user.name });
          } else {
            sendUserVerificationRejectedEmail({ userEmail: user.email, userName: user.name, reason: notes || 'Identity verification rejected by Admin' });
          }
        }
      } catch (mailErr) {
        console.warn('Verification mail dispatch note:', mailErr.message);
      }
    }

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
    const user = await prisma.user.update({
      where: { id },
      data: { isApproved: true, isVerified: true },
    });
    if (user.email) {
      try {
        if (user.role === 'BREAKUP_BUDDY') {
          sendBuddyApprovedEmail({ buddyEmail: user.email, buddyName: user.displayName || user.name });
        } else if (user.role === 'MATCHMAKER') {
          sendRMApprovedEmail({ email: user.email, name: user.name });
        } else if (user.role === 'HOST' || user.role === 'EVENT_MANAGER') {
          sendHostApprovedEmail({ email: user.email, name: user.name });
        } else {
          sendUserVerificationApprovedEmail({ userEmail: user.email, userName: user.name });
        }
      } catch (mailErr) {
        console.warn('Legacy approve mail dispatch note:', mailErr.message);
      }
    }
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
    const { sortBy = 'createdAt', order = 'desc', rating, search } = req.query;

    // 1. Fetch real buddy reviews
    const buddyReviews = await prisma.buddyReview.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        buddy: { select: { id: true, name: true, displayName: true, role: true } },
      },
    });

    // 2. Fetch real date feedbacks (if any exist)
    let dateFeedbacks = [];
    try {
      dateFeedbacks = await prisma.$queryRawUnsafe(`
        SELECT f."id", f."rating", f."feedback", f."createdAt", f."userId", f."matchId",
               u."name" as "userName", u."email" as "userEmail",
               m."clientId", m."suggestedProfileId",
               u_client."name" as "clientName",
               u_sugg."name" as "suggName"
        FROM "DateFeedback" f
        LEFT JOIN "User" u ON f."userId" = u."id"
        LEFT JOIN "MatchSuggestion" m ON f."matchId" = m."id"
        LEFT JOIN "User" u_client ON m."clientId" = u_client."id"
        LEFT JOIN "User" u_sugg ON m."suggestedProfileId" = u_sugg."id"
      `);
    } catch (e) {
      dateFeedbacks = [];
    }

    const formattedDateFeedbacks = (dateFeedbacks || []).map(df => {
      const isClient = df.userId === df.clientId;
      const partnerName = isClient ? (df.suggName || 'Date Connection') : (df.clientName || 'Date Connection');
      return {
        id: df.id,
        rating: df.rating,
        comment: df.feedback,
        createdAt: df.createdAt,
        user: {
          id: df.userId,
          name: df.userName || 'Member',
          email: df.userEmail || '',
          role: 'USER',
        },
        buddy: {
          id: df.matchId,
          name: partnerName,
          displayName: partnerName,
          role: 'DATE_MATCH',
        },
      };
    });

    // 3. Combine all genuine reviews
    let allReviews = [
      ...buddyReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.user,
        buddy: r.buddy,
      })),
      ...formattedDateFeedbacks,
    ];

    // Compute stats across ALL real reviews before filtering
    const totalCount = allReviews.length;
    const avgRating = totalCount > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
      : 0;
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach(r => {
      if (ratingBreakdown[r.rating] !== undefined) ratingBreakdown[r.rating]++;
    });

    // 4. Apply Rating Filter
    if (rating && !isNaN(parseInt(rating, 10)) && parseInt(rating, 10) > 0) {
      const targetRating = parseInt(rating, 10);
      allReviews = allReviews.filter(r => r.rating === targetRating);
    }

    // 5. Apply Search Filter
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      allReviews = allReviews.filter(r => {
        const commentMatch = r.comment && r.comment.toLowerCase().includes(q);
        const userMatch = r.user?.name && r.user.name.toLowerCase().includes(q);
        const emailMatch = r.user?.email && r.user.email.toLowerCase().includes(q);
        const buddyMatch = (r.buddy?.name && r.buddy.name.toLowerCase().includes(q)) ||
                           (r.buddy?.displayName && r.buddy.displayName.toLowerCase().includes(q));
        return commentMatch || userMatch || emailMatch || buddyMatch;
      });
    }

    // 6. Dynamic Sorting
    allReviews.sort((a, b) => {
      if (sortBy === 'rating') {
        return order === 'asc' ? a.rating - b.rating : b.rating - a.rating;
      } else if (sortBy === 'userName') {
        const nameA = (a.user?.name || '').toLowerCase();
        const nameB = (b.user?.name || '').toLowerCase();
        return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortBy === 'buddyName') {
        const nameA = (a.buddy?.displayName || a.buddy?.name || '').toLowerCase();
        const nameB = (b.buddy?.displayName || b.buddy?.name || '').toLowerCase();
        return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    // 7. Providers & Members dropdown lists for admin modal
    const [providers, members] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: ['BREAKUP_BUDDY', 'MATCHMAKER'] } },
        select: { id: true, name: true, displayName: true, role: true },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: { role: 'USER' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
        take: 50,
      }),
    ]);

    return res.json({
      success: true,
      reviews: allReviews,
      providers,
      members,
      stats: {
        total: totalCount,
        avgRating,
        ratingBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// Update / Edit Review
router.put('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Handle DateFeedback if prefix is FB-
    if (id.startsWith('FB-')) {
      const existing = await prisma.$queryRawUnsafe(`SELECT * FROM "DateFeedback" WHERE "id" = $1`, id);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
      const newRating = rating !== undefined ? Math.min(5, Math.max(1, parseInt(rating, 10))) : existing[0].rating;
      const newComment = comment !== undefined ? String(comment).trim() : existing[0].feedback;

      await prisma.$executeRawUnsafe(
        `UPDATE "DateFeedback" SET "rating" = $1, "feedback" = $2 WHERE "id" = $3`,
        newRating, newComment, id
      );

      await logAudit(req, {
        action: 'DATE_REVIEW_EDITED',
        targetType: 'DATE_REVIEW',
        targetId: id,
        before: { rating: existing[0].rating, feedback: existing[0].feedback },
        after: { rating: newRating, feedback: newComment },
        reason: req.body.reason || 'Admin modified date feedback',
      });

      return res.json({ success: true, message: 'Review updated successfully' });
    }

    const existing = await prisma.buddyReview.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const dataToUpdate = {};
    if (rating !== undefined && !isNaN(parseInt(rating, 10))) {
      dataToUpdate.rating = Math.min(5, Math.max(1, parseInt(rating, 10)));
    }
    if (comment !== undefined) {
      dataToUpdate.comment = String(comment).trim();
    }

    const updated = await prisma.buddyReview.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: { select: { id: true, name: true, email: true } },
        buddy: { select: { id: true, name: true, displayName: true, role: true } },
      },
    });

    await logAudit(req, {
      action: 'REVIEW_EDITED',
      targetType: 'REVIEW',
      targetId: id,
      before: { rating: existing.rating, comment: existing.comment },
      after: { rating: updated.rating, comment: updated.comment },
      reason: req.body.reason || 'Admin modified rating/comment',
    });

    return res.json({ success: true, message: 'Review updated successfully', review: updated });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ success: false, message: 'Failed to update review' });
  }
});

// Delete Review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Handle DateFeedback if prefix is FB-
    if (id.startsWith('FB-')) {
      const existing = await prisma.$queryRawUnsafe(`SELECT * FROM "DateFeedback" WHERE "id" = $1`, id);
      if (!existing || existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }
      await prisma.$executeRawUnsafe(`DELETE FROM "DateFeedback" WHERE "id" = $1`, id);

      await logAudit(req, {
        action: 'DATE_REVIEW_DELETED',
        targetType: 'DATE_REVIEW',
        targetId: id,
        before: existing[0],
        reason: req.body?.reason || 'Admin deleted date feedback',
      });

      return res.json({ success: true, message: 'Review deleted successfully' });
    }

    const existing = await prisma.buddyReview.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await prisma.buddyReview.delete({ where: { id } });

    await logAudit(req, {
      action: 'REVIEW_DELETED',
      targetType: 'REVIEW',
      targetId: id,
      before: existing,
      reason: req.body?.reason || 'Admin deleted review',
    });

    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
});

// Create / Add Review (admin entry)
router.post('/reviews', async (req, res) => {
  try {
    const { userId, buddyId, rating, comment } = req.body;

    if (!userId || !buddyId || !rating) {
      return res.status(400).json({ success: false, message: 'Reviewer (userId), Provider (buddyId), and rating are required.' });
    }

    const newReview = await prisma.buddyReview.create({
      data: {
        userId,
        buddyId,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
        comment: comment ? String(comment).trim() : '',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        buddy: { select: { id: true, name: true, displayName: true, role: true } },
      },
    });

    await logAudit(req, {
      action: 'REVIEW_CREATED',
      targetType: 'REVIEW',
      targetId: newReview.id,
      after: newReview,
      reason: 'Admin manually recorded review',
    });

    return res.json({ success: true, message: 'Review created successfully', review: newReview });
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ success: false, message: 'Failed to create review' });
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

    const ticketRows = await prisma.$queryRawUnsafe(`
      SELECT t.*, u."name" as "userName", u."email" as "userEmail"
      FROM "SupportTicket" t
      JOIN "User" u ON t."userId" = u."id"
      WHERE t."id" = $1
    `, id);
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

    // Send Support Reply Email to User
    if (ticket.userEmail) {
      sendSupportTicketReplyEmail({
        userEmail: ticket.userEmail,
        userName: ticket.userName,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        replyMessage: message.trim(),
        staffName: req.staff.name,
      }).catch(err => console.warn('Support reply email note:', err.message));
    }

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

      // Email Notification Triggers
      try {
        const ticketRows = await prisma.$queryRawUnsafe(`
          SELECT t.*, u."name" as "userName", u."email" as "userEmail"
          FROM "SupportTicket" t
          JOIN "User" u ON t."userId" = u."id"
          WHERE t."id" = $1
        `, id);
        const ticket = ticketRows[0];
        if (ticket) {
          if ((status === 'RESOLVED' || status === 'CLOSED') && ticket.userEmail) {
            sendSupportTicketResolvedEmail({
              userEmail: ticket.userEmail,
              userName: ticket.userName,
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
            }).catch(e => {});
          }
          if ((priority === 'HIGH' || priority === 'URGENT') && priority !== ticket.priority) {
            sendHighPriorityTicketAdminAlert({
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              userName: ticket.userName,
              userEmail: ticket.userEmail,
              priority,
              description: ticket.description,
            }).catch(e => {});
          }
        }
      } catch (mailErr) {
        console.warn('Support status mail note:', mailErr.message);
      }
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
    const { title, message, type = 'ANNOUNCEMENT', targetAudience = 'All Users', sendEmail = true } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const annId = 'notif-' + Date.now();
    let recipientUsers = [];

    if (targetAudience === 'Upcoming Event Attendees' || targetAudience === 'Event Attendees') {
      recipientUsers = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT u."email", u."name"
        FROM "EventRegistration" er
        JOIN "User" u ON er."userId" = u."id"
        WHERE u."email" IS NOT NULL
        LIMIT 200
      `);
    } else if (targetAudience === 'Relationship Manager Clients' || targetAudience === 'RM Subscribers') {
      recipientUsers = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT u."email", u."name"
        FROM "Subscription" s
        JOIN "User" u ON s."userId" = u."id"
        WHERE s."status" = 'ACTIVE' AND s."serviceType" = 'RELATIONSHIP_MANAGER' AND u."email" IS NOT NULL
        LIMIT 200
      `);
    } else if (targetAudience === 'Breakup Buddy Circles' || targetAudience === 'Buddy Subscribers') {
      recipientUsers = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT u."email", u."name"
        FROM "Subscription" s
        JOIN "User" u ON s."userId" = u."id"
        WHERE s."status" = 'ACTIVE' AND s."serviceType" = 'BREAKUP_BUDDY' AND u."email" IS NOT NULL
        LIMIT 200
      `);
    } else {
      recipientUsers = await prisma.$queryRawUnsafe(`
        SELECT "email", "name"
        FROM "User"
        WHERE COALESCE("status", 'ACTIVE') = 'ACTIVE' AND "email" IS NOT NULL
        LIMIT 200
      `);
    }

    const recipientCount = recipientUsers.length;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "NotificationAnnouncement" ("id", "title", "message", "type", "targetAudience", "sentBy", "recipientCount", "sentAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, annId, title, message, type, targetAudience, req.staff.name, recipientCount);

    // Dispatch emails to recipients in background
    if (sendEmail) {
      (async () => {
        for (const u of recipientUsers) {
          if (u.email) {
            sendBroadcastAnnouncementEmail({
              recipientEmail: u.email,
              recipientName: u.name,
              title,
              message,
              announcementType: type,
            }).catch(e => {});
          }
        }
      })().catch(err => console.warn('Broadcast background mail note:', err.message));
    }

    await logAudit(req, {
      action: 'PLATFORM_ANNOUNCEMENT_BROADCAST',
      targetType: 'NOTIFICATION',
      targetId: annId,
      after: { title, type, targetAudience, recipientCount },
      reason: 'Admin broadcast platform announcement',
    });

    return res.status(201).json({ success: true, message: `Announcement broadcasted & emailed to ${recipientCount} recipients`, annId });
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
    const { code, discountType = 'PERCENTAGE', discountAmount, applicableService = 'ALL', minOrderAmount = 0, maxUses = 100, perUserLimit = 1, expiryDate, sendEmail = false } = req.body;
    if (!code || discountAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount amount required' });
    }

    const couponId = 'cpn-' + Date.now();
    const cleanCode = code.trim().toUpperCase();

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Coupon" ("id", "code", "discountType", "discountAmount", "applicableService", "minOrderAmount", "maxUses", "usedCount", "perUserLimit", "startDate", "expiryDate", "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, NOW(), $9, true)
    `, couponId, cleanCode, discountType, parseFloat(discountAmount), applicableService, parseFloat(minOrderAmount), parseInt(maxUses, 10), parseInt(perUserLimit, 10), expiryDate ? new Date(expiryDate) : null);

    // Optional promotional email blast
    if (sendEmail) {
      (async () => {
        const users = await prisma.$queryRawUnsafe(`
          SELECT "email", "name" FROM "User" WHERE COALESCE("status", 'ACTIVE') = 'ACTIVE' AND "email" IS NOT NULL LIMIT 150
        `);
        for (const u of users) {
          if (u.email) {
            sendCouponPromoEmail({
              userEmail: u.email,
              userName: u.name,
              code: cleanCode,
              discountAmount: parseFloat(discountAmount),
              discountType,
              minOrderAmount: parseFloat(minOrderAmount),
              expiryDate,
            }).catch(e => {});
          }
        }
      })().catch(err => console.warn('Coupon promo mail note:', err.message));
    }

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

    if (req.staff.id === id && status && status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'You cannot deactivate or suspend your own Super Admin account.' });
    }

    const allowedStatuses = ['ACTIVE', 'DEACTIVATED', 'SUSPENDED'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Allowed values: ACTIVE, DEACTIVATED, SUSPENDED' });
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

// Fetch Admin Earnings (5% cut from every package and payment across the website)
router.get('/earnings', async (req, res) => {
  try {
    const rawPayments = await prisma.$queryRawUnsafe(`
      SELECT 
        p."id",
        p."amount"::float as "sourceAmount",
        p."createdAt",
        p."type",
        COALESCE(p."description", p."type") as "description",
        p."referenceId",
        p."gateway",
        COALESCE(u."name", 'User') as "userName",
        COALESCE(u."email", 'N/A') as "userEmail"
      FROM "Payment" p
      LEFT JOIN "User" u ON p."userId" = u."id"
      WHERE UPPER(p."status") = 'SUCCESS' AND p."type" != 'RM_EARNING_DATING'
      UNION ALL
      SELECT
        hp."id",
        hp."amount"::float as "sourceAmount",
        hp."createdAt",
        'HOST_SUBSCRIPTION' as "type",
        CONCAT('Host Subscription (', hp."plan", ')') as "description",
        hp."razorpayPaymentId" as "referenceId",
        'Razorpay' as "gateway",
        COALESCE(u."name", 'Host') as "userName",
        COALESCE(u."email", 'N/A') as "userEmail"
      FROM "HostPayment" hp
      LEFT JOIN "User" u ON hp."hostId" = u."id"
      WHERE UPPER(hp."status") = 'PAID'
        AND NOT EXISTS (
          SELECT 1 FROM "Payment" p2 
          WHERE p2."referenceId" = hp."razorpayPaymentId" 
             OR p2."referenceId" = hp."razorpayOrderId"
        )
      ORDER BY "createdAt" DESC
    `);

    // Map each payment to 5% cut
    const breakdown = {
      EVENT_TICKET: { count: 0, volume: 0, earned: 0 },
      DATING_PACKAGE: { count: 0, volume: 0, earned: 0 },
      HOST_SUBSCRIPTION: { count: 0, volume: 0, earned: 0 },
      OTHER: { count: 0, volume: 0, earned: 0 },
    };

    const earnings = rawPayments.map(pkg => {
      const sourceAmount = Number(pkg.sourceAmount) || 0;
      const adminCut = Math.round((sourceAmount * 0.05) * 100) / 100; // Exact 5% cut

      let typeLabel = 'Platform Payment (5%)';
      let categoryKey = 'OTHER';

      if (pkg.type === 'EVENT_TICKET') {
        typeLabel = 'Event Ticket Booking (5%)';
        categoryKey = 'EVENT_TICKET';
      } else if (pkg.type === 'DATING_PACKAGE') {
        typeLabel = 'Dating Package (5%)';
        categoryKey = 'DATING_PACKAGE';
      } else if (pkg.type === 'BREAKUP_BUDDY_PACKAGE' || pkg.type === 'SERVICE_PACKAGE') {
        typeLabel = 'Breakup Buddy Package (5%)';
        categoryKey = 'DATING_PACKAGE';
      } else if (pkg.type === 'HOST_SUBSCRIPTION') {
        typeLabel = 'Host Subscription (5%)';
        categoryKey = 'HOST_SUBSCRIPTION';
      } else if (pkg.type) {
        typeLabel = `${pkg.type.replace(/_/g, ' ')} (5%)`;
      }

      if (breakdown[categoryKey]) {
        breakdown[categoryKey].count += 1;
        breakdown[categoryKey].volume = Math.round((breakdown[categoryKey].volume + sourceAmount) * 100) / 100;
        breakdown[categoryKey].earned = Math.round((breakdown[categoryKey].earned + adminCut) * 100) / 100;
      }

      return {
        id: pkg.id,
        createdAt: pkg.createdAt,
        sourceAmount,
        amount: adminCut, // 5% cut
        userName: pkg.userName || 'User',
        userEmail: pkg.userEmail || 'N/A',
        paymentType: pkg.type || 'PAYMENT',
        category: categoryKey,
        type: typeLabel,
        description: pkg.description || typeLabel,
        referenceId: pkg.referenceId || pkg.id,
        gateway: pkg.gateway || 'Razorpay',
      };
    });

    const totalEarned = Math.round(earnings.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
    const totalVolume = Math.round(earnings.reduce((sum, e) => sum + e.sourceAmount, 0) * 100) / 100;

    return res.json({
      success: true,
      cutPercentage: 5,
      totalEarned,
      totalVolume,
      count: earnings.length,
      breakdown,
      earnings,
    });
  } catch (error) {
    console.error('Error fetching admin earnings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin earnings' });
  }
});

// ==========================================
// 24. SMTP DIAGNOSTICS & TEST EMAIL
// ==========================================
router.post('/test-email', async (req, res) => {
  try {
    const { toEmail, previewNote } = req.body;
    const targetEmail = toEmail || req.staff.email || process.env.MAIL_USERNAME || 'yogithamgowdayogitha@gmail.com';

    const result = await sendTestEmail({
      toEmail: targetEmail,
      subject: `✨ [Live Test] JabWeMeet Admin Email Dispatch to ${targetEmail}`,
      previewNote: previewNote || 'Live test triggered directly from JabWeMeet Admin Command Center.',
    });

    await logAudit(req, {
      action: 'ADMIN_SMTP_TEST_EMAIL_SENT',
      targetType: 'EMAIL',
      targetId: targetEmail,
      reason: 'Admin triggered diagnostic SMTP test',
    });

    return res.json({
      success: true,
      message: `Test email successfully sent to ${targetEmail}! Please check the inbox (and Spam/Promotions folder).`,
      result,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to send test email: ${error.message}`,
    });
  }
});

module.exports = router;