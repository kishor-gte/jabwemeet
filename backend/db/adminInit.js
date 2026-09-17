const prisma = require('../db');

async function initAdminDb() {
  try {
    console.log('[AdminInit] Checking & running idempotent admin schema migrations...');

    // 1. Extend User table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "staffRole" VARCHAR(50) DEFAULT 'SUPER_ADMIN',
      ADD COLUMN IF NOT EXISTS "identityVerified" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "mobileVerified" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "internalNotes" TEXT,
      ADD COLUMN IF NOT EXISTS "isAvailableForRequests" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "weeklySchedule" JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "blockedDates" TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);

    // Ensure ADMIN users have default staffRole and status ONLY if unset (never overwrite deactivated/suspended statuses)
    await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET "staffRole" = COALESCE("staffRole", 'SUPER_ADMIN'),
          "status" = COALESCE("status", 'ACTIVE'),
          "identityVerified" = COALESCE("identityVerified", true)
      WHERE "role" = 'ADMIN' AND ("staffRole" IS NULL OR "status" IS NULL OR "identityVerified" IS NULL);
    `);

    // 2. Extend Event table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "coverImage" TEXT,
      ADD COLUMN IF NOT EXISTS "address" TEXT,
      ADD COLUMN IF NOT EXISTS "mapLocation" TEXT,
      ADD COLUMN IF NOT EXISTS "rules" TEXT,
      ADD COLUMN IF NOT EXISTS "participationRules" TEXT,
      ADD COLUMN IF NOT EXISTS "dressCode" TEXT,
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'PUBLISHED',
      ADD COLUMN IF NOT EXISTS "faqs" JSONB DEFAULT '[]'::jsonb;
    `);

    // Update existing events with default cover images and status if missing
    await prisma.$executeRawUnsafe(`
      UPDATE "Event" 
      SET "status" = 'PUBLISHED' 
      WHERE "status" IS NULL;
    `);

    // 3. EventRegistration table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EventRegistration" (
        "id" TEXT PRIMARY KEY,
        "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "ticketCode" TEXT UNIQUE NOT NULL,
        "qrCode" TEXT,
        "paymentStatus" VARCHAR(50) DEFAULT 'PAID',
        "status" VARCHAR(50) DEFAULT 'CONFIRMED',
        "checkedIn" BOOLEAN DEFAULT false,
        "checkedInAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "idx_event_reg_event" ON "EventRegistration"("eventId");
      CREATE INDEX IF NOT EXISTS "idx_event_reg_user" ON "EventRegistration"("userId");
    `);

    // 4. Payment table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "type" VARCHAR(50) NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "currency" VARCHAR(10) DEFAULT 'INR',
        "status" VARCHAR(50) DEFAULT 'SUCCESS',
        "gateway" VARCHAR(50) DEFAULT 'Razorpay',
        "referenceId" TEXT,
        "description" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "idx_payment_user" ON "Payment"("userId");
    `);

    // 5. Refund table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Refund" (
        "id" TEXT PRIMARY KEY,
        "paymentId" TEXT REFERENCES "Payment"("id") ON DELETE SET NULL,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "amount" DOUBLE PRECISION NOT NULL,
        "reason" TEXT NOT NULL,
        "status" VARCHAR(50) DEFAULT 'PENDING',
        "processedBy" TEXT,
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "idx_refund_user" ON "Refund"("userId");
    `);

    // 6. Invoice table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Invoice" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "paymentId" TEXT REFERENCES "Payment"("id") ON DELETE SET NULL,
        "invoiceNumber" TEXT UNIQUE NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "taxAmount" DOUBLE PRECISION DEFAULT 0,
        "status" VARCHAR(50) DEFAULT 'PAID',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. ServicePackage table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ServicePackage" (
        "id" TEXT PRIMARY KEY,
        "type" VARCHAR(50) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "billingCycle" VARCHAR(50) DEFAULT 'MONTHLY',
        "durationDays" INTEGER DEFAULT 30,
        "sessionLimit" INTEGER DEFAULT 4,
        "callLimit" INTEGER DEFAULT 8,
        "chatLimit" INTEGER DEFAULT 100,
        "description" TEXT,
        "features" JSONB DEFAULT '[]'::jsonb,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Subscription table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "packageId" TEXT REFERENCES "ServicePackage"("id") ON DELETE SET NULL,
        "serviceType" VARCHAR(50) NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "billingCycle" VARCHAR(50) DEFAULT 'MONTHLY',
        "status" VARCHAR(50) DEFAULT 'ACTIVE',
        "startDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "expiryDate" TIMESTAMP NOT NULL,
        "autoRenewal" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "idx_subscription_user" ON "Subscription"("userId");
    `);

    // 9. Report table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Report" (
        "id" TEXT PRIMARY KEY,
        "reporterId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
        "reportedUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
        "reportedEventId" TEXT REFERENCES "Event"("id") ON DELETE SET NULL,
        "category" VARCHAR(50) NOT NULL,
        "reason" TEXT NOT NULL,
        "details" TEXT,
        "status" VARCHAR(50) DEFAULT 'OPEN',
        "internalNotes" TEXT,
        "resolvedBy" TEXT,
        "resolvedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 10. SupportTicket table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SupportTicket" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "ticketNumber" TEXT UNIQUE NOT NULL,
        "category" VARCHAR(50) NOT NULL,
        "subject" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "priority" VARCHAR(50) DEFAULT 'MEDIUM',
        "status" VARCHAR(50) DEFAULT 'OPEN',
        "assignedStaffId" TEXT,
        "replies" JSONB DEFAULT '[]'::jsonb,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Coupon table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Coupon" (
        "id" TEXT PRIMARY KEY,
        "code" VARCHAR(50) UNIQUE NOT NULL,
        "discountType" VARCHAR(50) DEFAULT 'PERCENTAGE',
        "discountAmount" DOUBLE PRECISION NOT NULL,
        "applicableService" VARCHAR(50) DEFAULT 'ALL',
        "minOrderAmount" DOUBLE PRECISION DEFAULT 0,
        "maxUses" INTEGER DEFAULT 100,
        "usedCount" INTEGER DEFAULT 0,
        "perUserLimit" INTEGER DEFAULT 1,
        "startDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "expiryDate" TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 12. SystemSetting table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "key" VARCHAR(100) PRIMARY KEY,
        "category" VARCHAR(50) NOT NULL,
        "value" JSONB NOT NULL,
        "updatedBy" TEXT,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 13. NotificationAnnouncement table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationAnnouncement" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" VARCHAR(50) DEFAULT 'ANNOUNCEMENT',
        "targetAudience" VARCHAR(100) DEFAULT 'All Users',
        "sentBy" TEXT,
        "recipientCount" INTEGER DEFAULT 0,
        "sentAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 14. AuditLog table (append-only)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT PRIMARY KEY,
        "staffId" TEXT,
        "staffName" TEXT,
        "action" TEXT NOT NULL,
        "targetType" TEXT NOT NULL,
        "targetId" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "beforeData" JSONB,
        "afterData" JSONB,
        "reason" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "idx_audit_created" ON "AuditLog"("createdAt" DESC);
      CREATE INDEX IF NOT EXISTS "idx_audit_target" ON "AuditLog"("targetType", "targetId");
    `);

    // 15. Seed default service packages if table is empty
    const packageCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "ServicePackage"`);
    if (packageCount[0].count === 0) {
      console.log('[AdminInit] Seeding default RM and Breakup Buddy packages...');
      const packages = [
        // RM Packages
        { id: 'pkg-rm-starter', type: 'RELATIONSHIP_MANAGER', name: 'Starter Connect', price: 2999, billingCycle: 'MONTHLY', durationDays: 30, sessionLimit: 2, callLimit: 4, chatLimit: 50, description: 'Personalized profile review and 2 hand-picked verified introductions per month.', features: JSON.stringify(['Dedicated Relationship Manager', '2 Handpicked Introductions/month', 'Pre-date Coaching Call', 'Chat Support']) },
        { id: 'pkg-rm-connect', type: 'RELATIONSHIP_MANAGER', name: 'Connect Pro', price: 4999, billingCycle: 'MONTHLY', durationDays: 30, sessionLimit: 4, callLimit: 8, chatLimit: 150, description: 'In-depth values assessment, priority matching queue, and 4 high-compatibility dates.', features: JSON.stringify(['Priority Matchmaker Queue', '4 Curated Dates/month', 'Feedback Analysis after each date', 'Venue Coordination & Booking']) },
        { id: 'pkg-rm-premium', type: 'RELATIONSHIP_MANAGER', name: 'Premium Harmony', price: 8999, billingCycle: 'MONTHLY', durationDays: 30, sessionLimit: 6, callLimit: 12, chatLimit: 300, description: 'Comprehensive matchmaking with offline background verification and bespoke date itineraries.', features: JSON.stringify(['Senior Matchmaker Assignment', 'Unlimited Curated Matches', 'Custom Date Experience Planning', '24/7 Relationship Advisor']) },
        { id: 'pkg-rm-elite', type: 'RELATIONSHIP_MANAGER', name: 'Elite Concierge', price: 14999, billingCycle: 'MONTHLY', durationDays: 30, sessionLimit: 10, callLimit: 20, chatLimit: 500, description: 'Executive confidential matchmaking with complete privacy protection and personal chaperone.', features: JSON.stringify(['VIP Confidential Roster', 'Private Venue Reservations', 'Relationship Psychologist Consultation', 'Dedicated Concierge']) },

        // Breakup Buddy Packages
        { id: 'pkg-bb-listen', type: 'BREAKUP_BUDDY', name: 'Listen & Vent', price: 799, billingCycle: 'PER_SESSION', durationDays: 7, sessionLimit: 1, callLimit: 1, chatLimit: 30, description: 'A safe, empathetic 45-minute listening session with no judgment.', features: JSON.stringify(['45-min Voice/Chat Session', 'Empathetic Verified Listener', 'Zero Judgment Environment', 'Follow-up Check-in Note']) },
        { id: 'pkg-bb-comfort', type: 'BREAKUP_BUDDY', name: 'Comfort & Grounding', price: 1999, billingCycle: 'WEEKLY', durationDays: 14, sessionLimit: 3, callLimit: 3, chatLimit: 100, description: 'Structured 3-session support through the emotional aftermath of a difficult breakup.', features: JSON.stringify(['3 Scheduled 45-min Sessions', 'Daily Affirmation & Check-in', 'No-Contact Accountability Buddy', 'Resource & Journaling Prompts']) },
        { id: 'pkg-bb-support', type: 'BREAKUP_BUDDY', name: 'Rebuilding Circle', price: 3499, billingCycle: 'MONTHLY', durationDays: 30, sessionLimit: 6, callLimit: 6, chatLimit: 250, description: 'Month-long companionship to regain confidence, self-care routines, and social presence.', features: JSON.stringify(['6 Focused 50-min Sessions', 'Weekly Healing Milestones', 'Access to Breakup Recovery Circle', 'Social Re-entry Guidance']) },
        { id: 'pkg-bb-companion', type: 'BREAKUP_BUDDY', name: 'Full Transition Companion', price: 5999, billingCycle: 'MONTHLY', durationDays: 45, sessionLimit: 10, callLimit: 10, chatLimit: 500, description: 'End-to-end compassionate partnership as you move from heartbreak to wholehearted living.', features: JSON.stringify(['10 Sessions + Unlimited Text Support', '24/7 Crisis Listening Window', 'Life Restructuring Gameplan', 'VIP Invitation to Moving-On Meetup']) },
      ];

      for (const p of packages) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "ServicePackage" ("id", "type", "name", "price", "billingCycle", "durationDays", "sessionLimit", "callLimit", "chatLimit", "description", "features", "isActive")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, true)
          ON CONFLICT ("id") DO NOTHING;
        `, p.id, p.type, p.name, p.price, p.billingCycle, p.durationDays, p.sessionLimit, p.callLimit, p.chatLimit, p.description, p.features);
      }
    }

    // 16. Seed default system settings if table is empty
    const settingsCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "SystemSetting"`);
    if (settingsCount[0].count === 0) {
      console.log('[AdminInit] Seeding default platform settings...');
      const defaultSettings = [
        { key: 'platform_general', category: 'general', value: JSON.stringify({ platformName: 'JabWeMeet', brandTagline: 'Real People. Real Places. Real Connections.', contactEmail: 'support@jabweemeet.com', supportPhone: '+91 98765 43210', timezone: 'Asia/Kolkata (IST)', currency: 'INR (₹)' }) },
        { key: 'platform_registration', category: 'registration', value: JSON.stringify({ minAge: 18, requireEmailVerification: true, requireMobileVerification: true, otpExpiryMinutes: 10, enableReferralBonus: true, referralDiscountPercent: 15 }) },
        { key: 'platform_events', category: 'events', value: JSON.stringify({ defaultEventCapacity: 40, cancellationWindowHours: 24, refundDeductionPercent: 5, minAgeRestricted: 21, autoPublishApprovedHosts: false }) },
        { key: 'platform_services', category: 'services', value: JSON.stringify({ maxActiveClientsPerRM: 15, defaultSessionMinutes: 45, allowEmergencyBuddyRequest: true, requireBothUsersConsentForDate: true }) },
        { key: 'platform_notifications', category: 'notifications', value: JSON.stringify({ emailNotificationsEnabled: true, smsNotificationsEnabled: true, inAppBroadcastEnabled: true, reminderHoursBeforeEvent: 4 }) },
        { key: 'platform_cms', category: 'content', value: JSON.stringify({
          heroHeadline: 'Real People. Real Places. Real Connections.',
          heroSubheadline: 'Step away from superficial swiping. Attend thoughtfully curated mixers, speed dates, and singles experiences across India.',
          aboutText: 'JabWeMeet is built on the truth that real chemistry happens in the real world. We combine safe real-world events, dedicated Relationship Managers, and empathetic Breakup Buddies.',
          safetyPledge: 'Every member profile is verified. Every event is hosted by background-vetted hosts in partner venues. Zero tolerance for harassment.',
          announcementBanner: 'Welcome to JabWeMeet 2026! Discover upcoming mixers and curated blind dinner dates in your city.'
        }) },
      ];

      for (const s of defaultSettings) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "SystemSetting" ("key", "category", "value", "updatedBy")
          VALUES ($1, $2, $3::jsonb, 'System')
          ON CONFLICT ("key") DO NOTHING;
        `, s.key, s.category, s.value);
      }
    }



    // 20. Seed initial audit log entry
    const auditCount = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "AuditLog"`);
    if (auditCount[0].count === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "AuditLog" ("id", "staffId", "staffName", "action", "targetType", "targetId", "ipAddress", "userAgent", "reason")
        VALUES ('aud-init', 'system', 'System Administrator', 'SYSTEM_INITIALIZATION', 'PLATFORM', 'SYSTEM', '127.0.0.1', 'Node.js/Prisma', 'Initial platform control center migration and schema setup.');
      `);
    }

    console.log('[AdminInit] Admin database schema and defaults initialized successfully.');
  } catch (error) {
    console.error('[AdminInit] Error during database initialization:', error);
  }
}

module.exports = { initAdminDb };
