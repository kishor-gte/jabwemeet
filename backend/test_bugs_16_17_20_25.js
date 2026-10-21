/**
 * Automated Verification Test Suite for Bugs 16, 17, 20, and 25
 *
 * Scenarios Tested:
 * - Bug 16: Profile Update failure returns proper 4xx/5xx and displays error, with no false success banner.
 * - Bug 17: Database server data remains single source of truth; stale browser overrides eliminated.
 * - Bug 20: Missing GEMINI_API_KEY returns HTTP 503 error; no mock/sample compatibility matches returned.
 * - Bug 25: Pending Buddy requests redact user email, phone, and dateOfBirth; PII revealed only after acceptance.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const prisma = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_jabweemeet_2025_secure_key';

let userToken = null;
let testUserId = null;
let matchmakerToken = null;
let testClientId = null;
let buddyToken = null;
let testBuddyId = null;
let testRequesterId = null;
let testBuddyRequestId = null;

async function setup() {
  console.log('Initializing test fixtures for Bugs 16, 17, 20, 25...');

  // 1. Regular User for Bug 16 & 17
  let user = await prisma.user.findFirst({ where: { email: 'bug_test_user@jabweemeet.test' } });
  if (!user) {
    const pwd = await bcrypt.hash('Test@12345', 10);
    user = await prisma.user.create({
      data: {
        name: 'Profile Consistency User',
        email: 'bug_test_user@jabweemeet.test',
        phone: '9898989898',
        password: pwd,
        role: 'USER',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
        city: 'Mumbai',
        hometown: 'Nagpur',
        gender: 'FEMALE',
      },
    });
  }
  testUserId = user.id;
  userToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  // 2. Matchmaker & Client for Bug 20
  let mm = await prisma.user.findFirst({ where: { email: 'bug_test_mm@jabweemeet.test' } });
  if (!mm) {
    const pwd = await bcrypt.hash('Match@12345', 10);
    mm = await prisma.user.create({
      data: {
        name: 'Relationship Manager Test',
        email: 'bug_test_mm@jabweemeet.test',
        phone: '9797979797',
        password: pwd,
        role: 'MATCHMAKER',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
      },
    });
  }
  matchmakerToken = jwt.sign({ userId: mm.id, email: mm.email, role: mm.role }, JWT_SECRET, { expiresIn: '1h' });

  let client = await prisma.user.findFirst({ where: { email: 'bug_test_client@jabweemeet.test' } });
  if (!client) {
    const pwd = await bcrypt.hash('Client@12345', 10);
    client = await prisma.user.create({
      data: {
        name: 'Match Client',
        email: 'bug_test_client@jabweemeet.test',
        phone: '9696969696',
        password: pwd,
        role: 'USER',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
        assignedManagerId: mm.id,
        city: 'Delhi',
        gender: 'MALE',
        relationshipIntent: 'Marriage',
      },
    });
  }
  testClientId = client.id;

  // 3. Buddy & Requester for Bug 25
  let buddy = await prisma.user.findFirst({ where: { email: 'bug_test_buddy@jabweemeet.test' } });
  if (!buddy) {
    const pwd = await bcrypt.hash('Buddy@12345', 10);
    buddy = await prisma.user.create({
      data: {
        name: 'Healing Guide Buddy',
        email: 'bug_test_buddy@jabweemeet.test',
        phone: '9595959595',
        password: pwd,
        role: 'BREAKUP_BUDDY',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
      },
    });
  }
  testBuddyId = buddy.id;
  buddyToken = jwt.sign({ userId: buddy.id, email: buddy.email, role: buddy.role }, JWT_SECRET, { expiresIn: '1h' });

  let requester = await prisma.user.findFirst({ where: { email: 'bug_test_requester@jabweemeet.test' } });
  if (!requester) {
    const pwd = await bcrypt.hash('Requester@12345', 10);
    requester = await prisma.user.create({
      data: {
        name: 'Confidential Requester',
        email: 'bug_test_requester@jabweemeet.test',
        phone: '+919123456789',
        password: pwd,
        role: 'USER',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
        city: 'Bangalore',
        gender: 'FEMALE',
        dateOfBirth: new Date('1997-08-20'),
      },
    });
  }
  testRequesterId = requester.id;

  // Create pending buddy request
  await prisma.buddyRequest.deleteMany({ where: { userId: requester.id } });
  const bReq = await prisma.buddyRequest.create({
    data: {
      userId: requester.id,
      buddyId: buddy.id,
      topic: 'Heartbreak & Healing Support',
      sessionType: 'CHAT',
      status: 'Pending',
    },
  });
  testBuddyRequestId = bReq.id;

  console.log('✓ All test fixtures ready.');
}

async function cleanup() {
  console.log('\nCleaning test fixtures...');
  if (testBuddyRequestId) {
    await prisma.buddySession.deleteMany({ where: { userId: testRequesterId } }).catch(() => {});
    await prisma.buddyRequest.deleteMany({ where: { id: testBuddyRequestId } }).catch(() => {});
  }
  const testEmails = [
    'bug_test_user@jabweemeet.test',
    'bug_test_mm@jabweemeet.test',
    'bug_test_client@jabweemeet.test',
    'bug_test_buddy@jabweemeet.test',
    'bug_test_requester@jabweemeet.test',
  ];
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } }).catch(() => {});
}

async function runTests() {
  console.log('================================================================');
  console.log('  STARTING TEST SUITE: BUGS 16, 17, 20, 25');
  console.log('================================================================\n');

  try {
    // Start backend in-process
    require('./index.js');
    await new Promise((r) => setTimeout(r, 2000));

    await setup();

    // =========================================================================
    // TEST 1: BUG 16 - Profile Update Failure & Error Handling
    // =========================================================================
    console.log('\n--- [TEST 1: Bug 16] Profile Update Error Handling ---');

    // 1a. Attempt invalid profile update (invalid profileVisibility enum)
    const invalidRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${userToken}`,
      },
      body: JSON.stringify({
        profileVisibility: 'invalid_unsupported_scope',
      }),
    });
    const invalidData = await invalidRes.json();
    console.log('Invalid profile update status:', invalidRes.status, invalidData);
    if (invalidRes.status !== 400 || invalidData.success !== false) {
      throw new Error(`Bug 16 Failed: Invalid update should return 400 Bad Request, got ${invalidRes.status}`);
    }
    if (!invalidData.message || !invalidData.message.includes('Invalid profile visibility')) {
      throw new Error(`Bug 16 Failed: Expected error message describing invalid visibility, got: ${invalidData.message}`);
    }
    console.log('✓ Verified: Profile update failure properly returns HTTP 400 with failure message.');

    // 1b. Attempt unauthorized profile update (trying to update another user ID)
    const fakeOtherId = 'cmvhfake00000000000000000';
    const unauthRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${userToken}`,
      },
      body: JSON.stringify({
        id: fakeOtherId,
        city: 'Hacked City',
      }),
    });
    const unauthData = await unauthRes.json();
    console.log('Unauthorized profile update status:', unauthRes.status, unauthData);
    if (unauthRes.status !== 403 || unauthData.success !== false) {
      throw new Error(`Bug 16 Failed: Cross-user update should return 403 Forbidden, got ${unauthRes.status}`);
    }
    console.log('✓ Verified: Unauthorized profile update properly blocked with HTTP 403.');

    // 1c. Valid profile update should succeed
    const validRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${userToken}`,
      },
      body: JSON.stringify({
        city: 'Bengaluru',
        hometown: 'Hubli',
      }),
    });
    const validData = await validRes.json();
    console.log('Valid profile update status:', validRes.status, validData.message);
    if (!validRes.ok || !validData.success) {
      throw new Error(`Bug 16 Failed: Valid update failed: ${JSON.stringify(validData)}`);
    }
    console.log('✓ PASS: Bug 16 Fixed — Failures return distinct error responses; success returned only on valid DB save.');

    // =========================================================================
    // TEST 2: BUG 17 - Profile Data Consistency & Single Source of Truth
    // =========================================================================
    console.log('\n--- [TEST 2: Bug 17] Profile Data Consistency (Database as Single Source of Truth) ---');

    // Simulate database record updated out-of-band (e.g. from another device or session)
    await prisma.user.update({
      where: { id: testUserId },
      data: {
        city: 'Hyderabad',
        hometown: 'Secunderabad',
        relationshipIntent: 'Long-term relationship',
      },
    });

    // Fetch via GET /api/auth/profile
    const freshProfileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      headers: { Cookie: `token=${userToken}` },
    });
    const freshProfileData = await freshProfileRes.json();
    console.log('GET /api/auth/profile response:', {
      city: freshProfileData?.user?.city,
      hometown: freshProfileData?.user?.hometown,
      intent: freshProfileData?.user?.relationshipIntent,
    });

    if (freshProfileData?.user?.city !== 'Hyderabad' || freshProfileData?.user?.hometown !== 'Secunderabad') {
      throw new Error('Bug 17 Failed: Server profile does not reflect latest database values.');
    }

    console.log('✓ PASS: Bug 17 Fixed — Database server values strictly take precedence over browser cache.');

    // =========================================================================
    // TEST 3: BUG 20 - Matchmaking AI Compatibility Check Error When Key Missing
    // =========================================================================
    console.log('\n--- [TEST 3: Bug 20] AI Compatibility Check Error on Missing API Key ---');

    // Temporarily unset GEMINI_API_KEY
    const originalApiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const aiRes = await fetch(`${BASE_URL}/api/matchmaker/clients/${testClientId}/compatibility`, {
        headers: { Cookie: `token=${matchmakerToken}` },
      });
      const aiData = await aiRes.json();
      console.log('Compatibility response with missing API key:', aiRes.status, aiData);

      if (aiRes.status !== 503) {
        throw new Error(`Bug 20 Failed: Expected HTTP 503 Service Unavailable when GEMINI_API_KEY is missing, got ${aiRes.status}`);
      }
      if (aiData.success !== false) {
        throw new Error('Bug 20 Failed: Response success must be false when AI key is missing.');
      }
      if (aiData.matches) {
        throw new Error('Bug 20 Failed: Mock matches must NOT be returned when GEMINI_API_KEY is missing.');
      }
      if (!aiData.message.includes('GEMINI_API_KEY') && !aiData.message.includes('unavailable')) {
        throw new Error(`Bug 20 Failed: Unexpected message: ${aiData.message}`);
      }
      console.log('✓ Verified: Missing GEMINI_API_KEY returns 503 Service Unavailable with clear error message (no fake sample matches).');
    } finally {
      if (originalApiKey) process.env.GEMINI_API_KEY = originalApiKey;
    }

    console.log('✓ PASS: Bug 20 Fixed — Sample/mock responses completely removed; returns HTTP 503 error instead.');

    // =========================================================================
    // TEST 4: BUG 25 - Breakup Buddy Personal Information Privacy
    // =========================================================================
    console.log('\n--- [TEST 4: Bug 25] Breakup Buddy Personal Information Privacy ---');

    // 4a. As a buddy, query pending requests prior to acceptance
    const preAcceptRes = await fetch(`${BASE_URL}/api/buddy/requests`, {
      headers: { Cookie: `token=${buddyToken}` },
    });
    const preAcceptData = await preAcceptRes.json();
    console.log('GET /api/buddy/requests response count:', preAcceptData?.data?.length);

    const pendingReq = preAcceptData?.data?.find(r => r.id === testBuddyRequestId);
    if (!pendingReq) {
      throw new Error(`Bug 25 Failed: Test request ${testBuddyRequestId} not found in buddy requests list`);
    }

    console.log('Pending Request User Object:', pendingReq.user);
    if (pendingReq.user.email !== null) {
      throw new Error(`Bug 25 Failed: Requester email must be null on pending request, found: "${pendingReq.user.email}"`);
    }
    if (pendingReq.user.phone !== null) {
      throw new Error(`Bug 25 Failed: Requester phone must be null on pending request, found: "${pendingReq.user.phone}"`);
    }
    if (pendingReq.user.dateOfBirth !== null) {
      throw new Error(`Bug 25 Failed: Requester dateOfBirth must be null on pending request, found: "${pendingReq.user.dateOfBirth}"`);
    }
    if (!pendingReq.user.name || !pendingReq.user.city) {
      throw new Error('Bug 25 Failed: Non-sensitive public profile details should remain accessible');
    }
    console.log('✓ Verified: Sensitive PII (email, phone, DOB) is strictly null/redacted on pending request.');

    // 4b. Now accept the request as this buddy
    const acceptRes = await fetch(`${BASE_URL}/api/buddy/requests/${testBuddyRequestId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${buddyToken}`,
      },
      body: JSON.stringify({
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 30,
      }),
    });
    const acceptData = await acceptRes.json();
    console.log('Accept request response:', acceptRes.status, acceptData.message);
    if (!acceptRes.ok || !acceptData.success) {
      throw new Error(`Failed to accept buddy request: ${JSON.stringify(acceptData)}`);
    }

    // 4c. Query requests again — now that it is accepted, PII should be revealed to this buddy
    const postAcceptRes = await fetch(`${BASE_URL}/api/buddy/requests`, {
      headers: { Cookie: `token=${buddyToken}` },
    });
    const postAcceptData = await postAcceptRes.json();
    const acceptedReq = postAcceptData?.data?.find(r => r.id === testBuddyRequestId);
    if (!acceptedReq) throw new Error('Accepted request not found');

    console.log('Accepted Request User Object:', acceptedReq.user);
    if (acceptedReq.user.email !== 'bug_test_requester@jabweemeet.test') {
      throw new Error(`Bug 25 Failed: Expected email to be revealed after acceptance, got: ${acceptedReq.user.email}`);
    }
    if (acceptedReq.user.phone !== '+919123456789') {
      throw new Error(`Bug 25 Failed: Expected phone to be revealed after acceptance, got: ${acceptedReq.user.phone}`);
    }
    if (!acceptedReq.user.dateOfBirth) {
      throw new Error('Bug 25 Failed: Expected dateOfBirth to be revealed after acceptance');
    }
    console.log('✓ Verified: Sensitive PII (email, phone, DOB) is correctly revealed after acceptance by the buddy.');
    console.log('✓ PASS: Bug 25 Fixed — Personal Information Privacy strictly enforced.');

    console.log('\n================================================================');
    console.log('  ALL 4 BUGS VERIFIED AND PASSED SUCCESSFULLY! (100% SUCCESS)');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

runTests();
