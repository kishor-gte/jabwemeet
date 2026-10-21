/**
 * End-to-End Automated Test Suite: Regular User Registration & Admin Approval Flow
 *
 * Verifies:
 * 1. User registers with role 'USER' -> isApproved is false, status is 'PENDING'.
 * 2. OTP verification succeeds -> pendingApproval: true returned, user is NOT logged in (no token cookie), isApproved remains false, status remains 'PENDING'.
 * 3. User attempts login prior to approval -> 403 Forbidden returned with pendingApproval: true.
 * 4. Admin overview & verification queue list the pending member.
 * 5. Admin approves member -> isApproved becomes true, status becomes 'ACTIVE', isVerified becomes true.
 * 6. User attempts login after admin approval -> 200 OK with valid JWT token.
 * 7. Admin updates status via PATCH /api/admin/users/:id/status -> successfully activates user.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const prisma = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_jabweemeet_2025_secure_key';

let testUser1Id = null;
let testUser2Id = null;
let adminToken = null;

async function setupAdmin() {
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('Admin@12345', 10);
    admin = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin_test@jabweemeet.test',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        isApproved: true,
        isVerified: true,
      },
    });
  }
  adminToken = jwt.sign(
    { userId: admin.id, email: admin.email, role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return admin;
}

async function cleanup() {
  console.log('\nCleaning up test artifacts...');
  const emails = ['test_pending_member@jabweemeet.test', 'test_direct_member@jabweemeet.test'];
  for (const email of emails) {
    await prisma.otpVerification.deleteMany({ where: { email } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email } }).catch(() => {});
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  STARTING ADMIN APPROVAL WORKFLOW TEST SUITE');
  console.log('================================================================\n');

  try {
    // Start backend server
    require('./index.js');
    await new Promise((r) => setTimeout(r, 2000));

    await cleanup();
    const admin = await setupAdmin();
    console.log(`✓ Admin initialized: ${admin.email}`);

    // -------------------------------------------------------------
    // Test 1: Register Regular User
    // -------------------------------------------------------------
    console.log('\n[Test 1] Registering a new regular user (USER role)...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pending Test User',
        email: 'test_pending_member@jabweemeet.test',
        phone: '9988776655',
        password: 'Password@123',
        role: 'USER',
        gender: 'MALE',
        city: 'Mumbai',
        dateOfBirth: '1995-05-15',
      }),
    });
    const regData = await regRes.json();
    console.log('Registration response status:', regRes.status, regData.message);
    if (!regRes.ok || !regData.success) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }

    const dbUser1 = await prisma.user.findUnique({ where: { email: 'test_pending_member@jabweemeet.test' } });
    if (!dbUser1) throw new Error('User not found in DB after registration');
    testUser1Id = dbUser1.id;

    console.log(`DB User initial state: isApproved = ${dbUser1.isApproved}, status = ${dbUser1.status}, emailVerified = ${dbUser1.emailVerified}`);
    if (dbUser1.isApproved !== false) throw new Error('Assertion failed: isApproved should be false on registration');
    if (dbUser1.status !== 'PENDING') throw new Error('Assertion failed: status should be PENDING on registration');
    console.log('✓ PASS: User registered with isApproved=false and status="PENDING"');

    // -------------------------------------------------------------
    // Test 2: Verify Registration OTP
    // -------------------------------------------------------------
    console.log('\n[Test 2] Fetching OTP from DB and verifying registration OTP...');
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { email: 'test_pending_member@jabweemeet.test', purpose: 'REGISTRATION', verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otpRecord) throw new Error('No OTP record generated for user');

    // Set known test OTP hash in DB
    const correctOtp = '123456';
    const knownHash = await bcrypt.hash(correctOtp, 10);
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { otpHash: knownHash },
    });
    console.log(`Set test OTP for verification: ${correctOtp}`);

    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_pending_member@jabweemeet.test',
        otp: correctOtp,
      }),
    });
    const verifyData = await verifyRes.json();
    console.log('Verify OTP response:', verifyRes.status, verifyData);

    if (!verifyRes.ok || !verifyData.success) throw new Error(`OTP verification failed: ${JSON.stringify(verifyData)}`);
    if (verifyData.pendingApproval !== true) throw new Error('Assertion failed: verify response pendingApproval must be true');
    if (verifyData.token) throw new Error('Assertion failed: No JWT token should be issued on OTP verify for pending user');

    const dbUser1AfterOtp = await prisma.user.findUnique({ where: { id: testUser1Id } });
    console.log(`DB User after OTP: isApproved = ${dbUser1AfterOtp.isApproved}, status = ${dbUser1AfterOtp.status}, emailVerified = ${dbUser1AfterOtp.emailVerified}`);
    if (dbUser1AfterOtp.isApproved !== false) throw new Error('Assertion failed: isApproved must remain false after OTP');
    if (dbUser1AfterOtp.status !== 'PENDING') throw new Error('Assertion failed: status must remain PENDING after OTP');
    if (dbUser1AfterOtp.emailVerified !== true) throw new Error('Assertion failed: emailVerified must be true after OTP');
    console.log('✓ PASS: User verified OTP, emailVerified=true, isApproved=false, status="PENDING", no auto-login token issued');

    // -------------------------------------------------------------
    // Test 3: Login Attempt Prior to Admin Approval
    // -------------------------------------------------------------
    console.log('\n[Test 3] Attempting login prior to admin approval...');
    const loginPreRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test_pending_member@jabweemeet.test',
        password: 'Password@123',
      }),
    });
    const loginPreData = await loginPreRes.json();
    console.log('Pre-approval login response status:', loginPreRes.status, loginPreData);
    if (loginPreRes.status !== 403) throw new Error(`Expected 403 Forbidden for pending user login, got ${loginPreRes.status}`);
    if (loginPreData.pendingApproval !== true) throw new Error('Expected pendingApproval: true in login error response');
    console.log('✓ PASS: Login correctly blocked with 403 and pendingApproval: true');

    // -------------------------------------------------------------
    // Test 4: Admin Verification & Users Queue
    // -------------------------------------------------------------
    console.log('\n[Test 4] Querying Admin verification endpoints...');
    const overviewRes = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Cookie: `token=${adminToken}` },
    });
    const overviewData = await overviewRes.json();
    console.log('Admin overview pending approvals count:', overviewData?.stats?.pendingApprovals);
    if ((overviewData?.stats?.pendingApprovals || 0) < 1) {
      throw new Error('Admin overview pendingApprovals should be >= 1');
    }

    const verifRes = await fetch(`${BASE_URL}/api/admin/verification`, {
      headers: { Cookie: `token=${adminToken}` },
    });
    const verifData = await verifRes.json();
    const foundInQueue = verifData.pendingUsers?.find(u => u.email === 'test_pending_member@jabweemeet.test');
    if (!foundInQueue) throw new Error('Pending user was not listed in GET /api/admin/verification queue');
    console.log(`Found pending user in verification queue: ${foundInQueue.name} (${foundInQueue.email})`);

    const usersFilterRes = await fetch(`${BASE_URL}/api/admin/users?status=PENDING`, {
      headers: { Cookie: `token=${adminToken}` },
    });
    const usersFilterData = await usersFilterRes.json();
    const foundInUsers = usersFilterData.users?.find(u => u.email === 'test_pending_member@jabweemeet.test');
    if (!foundInUsers) throw new Error('Pending user was not found in GET /api/admin/users?status=PENDING');
    console.log(`Found user in /users?status=PENDING: ${foundInUsers.name} (status=${foundInUsers.status}, isApproved=${foundInUsers.isApproved})`);
    console.log('✓ PASS: Admin overview, verification queue, and users filter all reflect pending approval user');

    // -------------------------------------------------------------
    // Test 5: Admin Approves User via /verification/:id
    // -------------------------------------------------------------
    console.log('\n[Test 5] Approving user via POST /api/admin/verification/:id...');
    const approveRes = await fetch(`${BASE_URL}/api/admin/verification/${testUser1Id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`,
      },
      body: JSON.stringify({ approved: true, notes: 'Verified and approved by admin test' }),
    });
    const approveData = await approveRes.json();
    console.log('Admin approve response:', approveRes.status, approveData);
    if (!approveRes.ok || !approveData.success) throw new Error(`Approve failed: ${JSON.stringify(approveData)}`);

    const dbUser1Approved = await prisma.user.findUnique({ where: { id: testUser1Id } });
    console.log(`DB User after approval: isApproved = ${dbUser1Approved.isApproved}, status = ${dbUser1Approved.status}, isVerified = ${dbUser1Approved.isVerified}`);
    if (dbUser1Approved.isApproved !== true) throw new Error('Assertion failed: isApproved should be true after admin approval');
    if (dbUser1Approved.status !== 'ACTIVE') throw new Error('Assertion failed: status should be ACTIVE after admin approval');
    if (dbUser1Approved.isVerified !== true) throw new Error('Assertion failed: isVerified should be true after admin approval');
    console.log('✓ PASS: User approved! isApproved=true, status="ACTIVE", isVerified=true');

    // -------------------------------------------------------------
    // Test 6: User Login Succeeds After Admin Approval
    // -------------------------------------------------------------
    console.log('\n[Test 6] Attempting login after admin approval...');
    const loginPostRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test_pending_member@jabweemeet.test',
        password: 'Password@123',
      }),
    });
    const loginPostData = await loginPostRes.json();
    console.log('Post-approval login response status:', loginPostRes.status, loginPostData.message);
    if (loginPostRes.status !== 200 || !loginPostData.success) {
      throw new Error(`Expected 200 OK after admin approval, got ${loginPostRes.status}: ${JSON.stringify(loginPostData)}`);
    }
    if (!loginPostData.token) throw new Error('Expected JWT token in login response');
    if (loginPostData.user.email !== 'test_pending_member@jabweemeet.test') throw new Error('Mismatched user in login response');
    console.log('✓ PASS: User logged in successfully with valid JWT token after admin approval!');

    // -------------------------------------------------------------
    // Test 7: Second User Approved via PATCH /api/admin/users/:id/status
    // -------------------------------------------------------------
    console.log('\n[Test 7] Testing direct approval via PATCH /api/admin/users/:id/status...');
    // Create second pending user directly
    const hashedPwd2 = await bcrypt.hash('Password@456', 10);
    const user2 = await prisma.user.create({
      data: {
        name: 'Direct Approval User',
        email: 'test_direct_member@jabweemeet.test',
        phone: '9988112233',
        password: hashedPwd2,
        role: 'USER',
        isApproved: false,
        status: 'PENDING',
        emailVerified: true,
      },
    });
    testUser2Id = user2.id;

    // Verify login is blocked
    const user2PreRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test_direct_member@jabweemeet.test',
        password: 'Password@456',
      }),
    });
    if (user2PreRes.status !== 403) throw new Error(`User 2 pre-approval login should be 403, got ${user2PreRes.status}`);

    // Admin updates status via PATCH /users/:id/status
    const patchRes = await fetch(`${BASE_URL}/api/admin/users/${testUser2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${adminToken}`,
      },
      body: JSON.stringify({
        isApproved: true,
        status: 'ACTIVE',
        isVerified: true,
        reason: 'Direct test approval',
      }),
    });
    const patchData = await patchRes.json();
    console.log('PATCH user status response:', patchRes.status, patchData);
    if (!patchRes.ok || !patchData.success) throw new Error(`PATCH status failed: ${JSON.stringify(patchData)}`);

    // Verify user 2 can now login
    const user2PostRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test_direct_member@jabweemeet.test',
        password: 'Password@456',
      }),
    });
    if (user2PostRes.status !== 200) throw new Error(`User 2 should be able to login after PATCH approval, got ${user2PostRes.status}`);
    console.log('✓ PASS: Second user successfully approved via PATCH /api/admin/users/:id/status and logged in!');

    console.log('\n================================================================');
    console.log('  ALL 7 TESTS PASSED SUCCESSFULLY! (100% SUCCESS)');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

runTests();
