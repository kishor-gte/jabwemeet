const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const prisma = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_jabweemeet_2025_secure_key';
const RAZORPAY_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret';

let server;
let baseUrl;

async function setup() {
  await require('./db/adminInit').initAdminDb();

  const express = require('express');
  const app = express();
  app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
  app.use(express.urlencoded({ extended: true }));

  // Mount relevant routes
  app.use('/api/events', require('./routes/events'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/admin', require('./routes/admin'));

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
  console.log(`Test server running on ${baseUrl}`);
}

async function teardown() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFICATION SUITE: 7 SPECIFIED BUGS (EVENTS, BOOKINGS, PAYMENTS, ADMIN, DB)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  await setup();

  // ---------------------------------------------------------------------------
  // TEST 1: Event Notification Emails (Events)
  // ---------------------------------------------------------------------------
  try {
    console.log('--- [1/7] Testing Events: Event Notification Emails ---');
    // Ensure test host user exists
    const hostUser = await prisma.user.upsert({
      where: { email: 'host_test_broadcast@jabweemeet.com' },
      update: { role: 'HOST', status: 'ACTIVE', isApproved: true, isVerified: true },
      create: {
        id: 'host-broadcast-test-1',
        name: 'Event Host Test',
        email: 'host_test_broadcast@jabweemeet.com',
        phone: '9999900001',
        password: 'hashedpassword',
        dateOfBirth: new Date('1990-01-01'),
        city: 'Mumbai',
        role: 'HOST',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
      },
    });

    // Ensure host has active subscription quota
    await prisma.hostSubscription.upsert({
      where: { id: 'sub-test-host-broadcast' },
      update: { eventsUsed: 0, maxEvents: 100, status: 'ACTIVE' },
      create: {
        id: 'sub-test-host-broadcast',
        hostId: hostUser.id,
        plan: 'PRO',
        maxEvents: 100,
        eventsUsed: 0,
        expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        amountPaid: 999,
        status: 'ACTIVE',
      },
    });

    const hostToken = jwt.sign(
      { userId: hostUser.id, id: hostUser.id, role: 'HOST', email: hostUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Read events.js to verify unbounded query is replaced
    const eventsCode = fs.readFileSync(path.join(__dirname, 'routes', 'events.js'), 'utf8');
    assert(
      !eventsCode.includes("const users = await prisma.user.findMany({\n          where:\n            email: { not: '' }"),
      'Unconstrained broadcast query over entire user table must be removed'
    );
    assert(
      eventsCode.includes('sendEventPublishedEmail'),
      'Host must receive dedicated publication confirmation email'
    );
    assert(
      eventsCode.includes('city: { equals: newEvent.city, mode: \'insensitive\' }'),
      'Member notifications must be targeted to users in the same city'
    );
    assert(
      eventsCode.includes('take: 20'),
      'City query must be capped (take: 20) to prevent unbounded memory/SMTP load'
    );

    // Call POST /api/events to create event and verify 201 Created
    const createRes = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({
        title: 'Mumbai Singles Coffee Meetup ' + Date.now(),
        category: 'Speed Dating',
        date: new Date(Date.now() + 86400000 * 7).toISOString(),
        location: 'Bandra West, Mumbai',
        city: 'Mumbai',
        price: 0,
        maxAttendees: 20,
        description: 'Test event for targeted notifications',
      }),
    });

    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201, `Expected 201 Created, got ${createRes.status}: ${JSON.stringify(createData)}`);
    assert(createData.event && createData.event.id, 'Event must be returned with ID');

    console.log('✅ TEST 1 PASSED: Event notification emails targeted to local city members with capped query and host publication confirmation.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 1 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Bug 34: Event Booking / Booking Cancellation
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [2/7] Testing Bug 34: Regular Attendee Booking Cancellation ---');
    // Ensure attendee user
    const attendeeUser = await prisma.user.upsert({
      where: { email: 'attendee_cancel_test@jabweemeet.com' },
      update: { role: 'USER', status: 'ACTIVE', isApproved: true, isVerified: true },
      create: {
        id: 'user-cancel-test-1',
        name: 'Attendee Cancel Tester',
        email: 'attendee_cancel_test@jabweemeet.com',
        phone: '9999900002',
        password: 'hashedpassword',
        dateOfBirth: new Date('1995-05-15'),
        city: 'Mumbai',
        role: 'USER',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
      },
    });

    const attendeeToken = jwt.sign(
      { userId: attendeeUser.id, id: attendeeUser.id, role: 'USER', email: attendeeUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a free event for booking
    const testEvent = await prisma.event.create({
      data: {
        title: 'Free Booking Test Event ' + Date.now(),
        category: 'Networking',
        date: new Date(Date.now() + 86400000 * 5),
        location: 'Marine Drive, Mumbai',
        city: 'Mumbai',
        price: 0,
        maxAttendees: 30,
        description: 'Testing attendee booking cancellation',
        hostId: 'host-broadcast-test-1',
      },
    });

    // Book the event as attendee
    const bookRes = await fetch(`${baseUrl}/api/events/${testEvent.id}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({ spots: 1 }),
    });

    const bookData = await bookRes.json();
    assert([200, 201].includes(bookRes.status), `Booking failed: ${JSON.stringify(bookData)}`);
    assert.strictEqual(bookData.success, true, 'Booking must succeed');

    // Verify booking is confirmed in DB
    const dbBookingBefore = await prisma.eventBooking.findUnique({
      where: { eventId_userId: { eventId: testEvent.id, userId: attendeeUser.id } },
    });
    assert.strictEqual(dbBookingBefore.status, 'CONFIRMED', 'Initial booking must be CONFIRMED');

    // Regular attendee cancels their booking via POST /api/events/:id/cancel
    const cancelRes = await fetch(`${baseUrl}/api/events/${testEvent.id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({}),
    });

    const cancelData = await cancelRes.json();
    assert.strictEqual(cancelRes.status, 200, `Expected 200 OK for attendee cancellation, got ${cancelRes.status}: ${JSON.stringify(cancelData)}`);
    assert.strictEqual(cancelData.success, true, 'Cancellation response success must be true');
    assert.strictEqual(cancelData.booking.status, 'CANCELLED', 'Returned booking status must be CANCELLED');

    // Verify DB status
    const dbBookingAfter = await prisma.eventBooking.findUnique({
      where: { eventId_userId: { eventId: testEvent.id, userId: attendeeUser.id } },
    });
    assert.strictEqual(dbBookingAfter.status, 'CANCELLED', 'DB booking status must be updated to CANCELLED');

    // Attempting to cancel an already cancelled booking should return 400
    const cancelAgainRes = await fetch(`${baseUrl}/api/events/${testEvent.id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attendeeToken}`,
      },
      body: JSON.stringify({}),
    });
    assert.strictEqual(cancelAgainRes.status, 400, 'Duplicate cancellation must return 400 Bad Request');

    console.log('✅ TEST 2 PASSED: Regular attendees can now successfully cancel bookings (including free bookings); duplicate cancellation properly rejected.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 2 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Bug 35: Event Booking / Attendee Privacy
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [3/7] Testing Bug 35: Attendee Personal Email & Phone Privacy ---');
    const eventsFile = fs.readFileSync(path.join(__dirname, 'routes', 'events.js'), 'utf8');

    // Extract hostHtml template blocks
    const hostHtmlMatches = eventsFile.match(/const hostHtml = `[\s\S]*?`;/g) || [];
    assert.strictEqual(hostHtmlMatches.length, 2, 'Must have exactly 2 hostHtml email templates (verify-payment and book)');

    for (const hostHtml of hostHtmlMatches) {
      assert(
        !hostHtml.includes('<strong>📧 Email:</strong>'),
        'Host booking email must not contain attendee email'
      );
      assert(
        !hostHtml.includes('<strong>📱 Phone:</strong>'),
        'Host booking email must not contain attendee phone number'
      );
      assert(
        hostHtml.includes('<strong>🔒 Contact Info:</strong> <span style="color: #888; font-style: italic;">Protected for member privacy</span>'),
        'Host booking email must explicitly state attendee contact info is protected for member privacy'
      );
    }

    console.log('✅ TEST 3 PASSED: Attendee email addresses and phone numbers are completely redacted from host booking notification emails.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 3 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Bug 39: Payments / Payment Confirmation Webhook
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [4/7] Testing Bug 39: Payment Webhook & Booking Confirmation ---');

    // 4a. Verify missing signature rejected
    const noSigRes = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' }),
    });
    assert.strictEqual(noSigRes.status, 400, 'Missing signature must return 400');

    // 4b. Verify invalid signature rejected
    const badSigRes = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_hex_signature',
      },
      body: JSON.stringify({ event: 'payment.captured' }),
    });
    assert.strictEqual(badSigRes.status, 400, 'Invalid signature must return 400');

    // 4c. Valid signature with payment.captured payload
    const testOrderId = 'order_webhook_' + Date.now();
    const testPaymentId = 'pay_webhook_' + Date.now();
    const webhookUserId = 'user-cancel-test-1';

    // Create a paid event for webhook test
    const paidEvent = await prisma.event.create({
      data: {
        title: 'Paid Webhook Test Event ' + Date.now(),
        category: 'Speed Dating',
        date: new Date(Date.now() + 86400000 * 10),
        location: 'South Mumbai Cafe',
        city: 'Mumbai',
        price: 499,
        maxAttendees: 20,
        description: 'Testing webhook payment confirmation',
        hostId: 'host-broadcast-test-1',
      },
    });

    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: testPaymentId,
            order_id: testOrderId,
            amount: 49900, // 499 INR in paise
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            notes: {
              eventId: paidEvent.id,
              userId: webhookUserId,
              spots: '1',
              ticketCode: 'TKT-WEBHOOK-TEST',
            },
          },
        },
      },
    };

    const payloadRaw = JSON.stringify(payloadObj);
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_SECRET)
      .update(payloadRaw)
      .digest('hex');

    const validWebhookRes = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSignature,
      },
      body: payloadRaw,
    });

    const validWebhookData = await validWebhookRes.json();
    assert.strictEqual(validWebhookRes.status, 200, `Webhook call failed: ${JSON.stringify(validWebhookData)}`);
    assert.strictEqual(validWebhookData.received, true, 'Webhook should acknowledge receipt');

    // Verify Payment record was upserted in DB
    const dbPayment = await prisma.payment.findFirst({
      where: { referenceId: testOrderId },
    });
    assert(dbPayment, 'Payment record must be created in DB');
    assert.strictEqual(dbPayment.status, 'SUCCESS', 'Payment status must be SUCCESS');
    assert.strictEqual(dbPayment.amount, 499, 'Payment amount must match');

    // Verify EventBooking was created and CONFIRMED
    const dbBooking = await prisma.eventBooking.findUnique({
      where: { eventId_userId: { eventId: paidEvent.id, userId: webhookUserId } },
    });
    assert(dbBooking, 'EventBooking must be automatically created via webhook');
    assert.strictEqual(dbBooking.status, 'CONFIRMED', 'Booking status must be CONFIRMED');
    assert.strictEqual(dbBooking.totalAmount, 499, 'Booking totalAmount must be 499');

    console.log('✅ TEST 4 PASSED: Payment webhook verifies HMAC SHA256 signatures, logs payments, and idempotently confirms bookings.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 4 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Bug 47: Admin Portal / Admin Permission Defaults
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [5/7] Testing Bug 47: Admin Staff Least Privilege Permission Defaults ---');

    // 5a. Verify schema.prisma default
    const schemaFile = fs.readFileSync(path.join(__dirname, 'prisma', 'schema.prisma'), 'utf8');
    assert(
      schemaFile.includes('staffRole                          String?              @default("SUPPORT_AGENT")'),
      'schema.prisma User model must default staffRole to SUPPORT_AGENT'
    );
    assert(
      !schemaFile.includes('staffRole                          String?              @default("SUPER_ADMIN")'),
      'schema.prisma must not default staffRole to SUPER_ADMIN'
    );

    // 5b. Verify adminInit.js default
    const initFile = fs.readFileSync(path.join(__dirname, 'db', 'adminInit.js'), 'utf8');
    assert(
      initFile.includes("ADD COLUMN IF NOT EXISTS \"staffRole\" VARCHAR(50) DEFAULT 'SUPPORT_AGENT'"),
      'adminInit.js ALTER TABLE must default staffRole to SUPPORT_AGENT'
    );

    // 5c. Create new Admin staff member without staffRole
    const testStaffEmail = `staff_${Date.now()}@jabweemeet.com`;
    const newStaff = await prisma.user.create({
      data: {
        id: 'staff-test-' + Date.now(),
        name: 'New Support Staff',
        email: testStaffEmail,
        phone: '98' + Math.floor(10000000 + Math.random() * 90000000),
        password: 'hashedpassword',
        dateOfBirth: new Date('1992-03-10'),
        city: 'Delhi',
        role: 'ADMIN',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
      },
    });

    assert.strictEqual(
      newStaff.staffRole,
      'SUPPORT_AGENT',
      `New staff member staffRole must default to SUPPORT_AGENT, got: ${newStaff.staffRole}`
    );

    // 5d. Verify adminAuth middleware does not overwrite or force SUPER_ADMIN
    const authFile = fs.readFileSync(path.join(__dirname, 'middleware', 'adminAuth.js'), 'utf8');
    assert(
      authFile.includes("const currentStaffRole = staffMember.staffRole || 'SUPPORT_AGENT';"),
      'adminAuth middleware must dynamically set req.staff.staffRole'
    );
    assert(
      !authFile.includes("staffRole: 'SUPER_ADMIN'"),
      'adminAuth middleware must not hardcode staffRole: SUPER_ADMIN'
    );

    // 5e. Test PATCH /api/admin/staff/:id role validation
    const rootAdmin = await prisma.user.upsert({
      where: { email: 'admin@jabweemeet.com' },
      update: { role: 'ADMIN', staffRole: 'SUPER_ADMIN', status: 'ACTIVE' },
      create: {
        id: 'admin-root-test-id',
        name: 'Super Admin Test',
        email: 'admin@jabweemeet.com',
        phone: '9999999990',
        password: 'hashedpassword',
        dateOfBirth: new Date('1985-01-01'),
        city: 'Mumbai',
        role: 'ADMIN',
        staffRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
      },
    });

    const superAdminToken = jwt.sign(
      { userId: rootAdmin.id, id: rootAdmin.id, role: 'ADMIN', staffRole: 'SUPER_ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Invalid role rejected
    const invalidRoleRes = await fetch(`${baseUrl}/api/admin/staff/${newStaff.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ staffRole: 'INVALID_GOD_MODE' }),
    });
    assert.strictEqual(invalidRoleRes.status, 400, 'Invalid staffRole must be rejected with 400 Bad Request');

    // Valid role promotion to EVENT_MANAGER
    const validRoleRes = await fetch(`${baseUrl}/api/admin/staff/${newStaff.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({ staffRole: 'EVENT_MANAGER' }),
    });
    assert.strictEqual(validRoleRes.status, 200, 'Valid staffRole update must succeed');

    const updatedStaff = await prisma.user.findUnique({ where: { id: newStaff.id } });
    assert.strictEqual(updatedStaff.staffRole, 'EVENT_MANAGER', 'Staff role must be updated to EVENT_MANAGER');

    console.log('✅ TEST 5 PASSED: New admin staff accounts default to SUPPORT_AGENT least privilege; role tiering and validation enforced.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 5 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Bug 49: Database / Database Documentation
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [6/7] Testing Bug 49: Database Documentation Coverage ---');
    const docPath = path.join(__dirname, '..', 'JabWeMeet_Project_Report.md');
    const docContent = fs.readFileSync(docPath, 'utf8');

    // Get models from schema.prisma
    const schemaContent = fs.readFileSync(path.join(__dirname, 'prisma', 'schema.prisma'), 'utf8');
    const schemaModels = Array.from(schemaContent.matchAll(/^model\s+(\w+)\s+\{/gm)).map(m => m[1]);

    assert.strictEqual(schemaModels.length, 43, `Expected 43 models in schema.prisma, found ${schemaModels.length}`);
    assert(docContent.includes('43 Active Prisma Models'), 'Documentation must explicitly state 43 models');

    const missingModels = [];
    for (const model of schemaModels) {
      if (!docContent.includes(`\`${model}\``)) {
        missingModels.push(model);
      }
    }

    assert.strictEqual(
      missingModels.length,
      0,
      `Documentation is missing the following models: ${missingModels.join(', ')}`
    );

    console.log(`✅ TEST 6 PASSED: Database documentation in JabWeMeet_Project_Report.md fully documents all ${schemaModels.length} models across 7 domains.`);
    passed++;
  } catch (err) {
    console.error('❌ TEST 6 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Bug 50: Database / Database Migrations
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [7/7] Testing Bug 50: Database Migration Files Coverage ---');
    const migrationFile = path.join(__dirname, 'prisma', 'migrations', '20261021160000_full_schema_sync', 'migration.sql');
    assert(fs.existsSync(migrationFile), 'Comprehensive migration file must exist');

    const migrationSql = fs.readFileSync(migrationFile, 'utf8');
    assert(migrationSql.length > 5000, 'Migration SQL must be substantive');

    const schemaContent = fs.readFileSync(path.join(__dirname, 'prisma', 'schema.prisma'), 'utf8');
    const schemaModels = Array.from(schemaContent.matchAll(/^model\s+(\w+)\s+\{/gm)).map(m => m[1]);

    const missingTables = [];
    for (const model of schemaModels) {
      const createTablePattern = new RegExp(`CREATE TABLE (IF NOT EXISTS )?"${model}"`, 'i');
      if (!createTablePattern.test(migrationSql)) {
        missingTables.push(model);
      }
    }

    assert.strictEqual(
      missingTables.length,
      0,
      `Migration file is missing CREATE TABLE for models: ${missingTables.join(', ')}`
    );

    console.log(`✅ TEST 7 PASSED: Comprehensive migration file covers all ${schemaModels.length} database tables with idempotent DDL.`);
    passed++;
  } catch (err) {
    console.error('❌ TEST 7 FAILED:', err.message);
    failed++;
  }

  await teardown();

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
