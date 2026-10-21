require('dotenv').config();
const prisma = require('./db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('🚀 Starting JabWeMeet OTP Storage & Delivery Verification Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const testEmail = `test.otp.${timestamp}@jabwemeet-test.local`;
    const testPassword = 'Password123!@#';
    const testPhone = '98765' + Math.floor(10000 + Math.random() * 90000);

    // -------------------------------------------------------------
    // Scenario 1: Clean Up & Verify DB Model
    // -------------------------------------------------------------
    console.log('--- Test 1: Verifying OtpVerification table in DB ---');
    const dbCount = await prisma.otpVerification.count();
    assert(typeof dbCount === 'number', 'OtpVerification table exists and is accessible via Prisma');

    // -------------------------------------------------------------
    // Scenario 2: Register user and ensure NO OTP in response
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Registering user & checking response privacy ---');
    let registerRes;
    try {
      const resp = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test OTP User',
          email: testEmail,
          phone: testPhone,
          password: testPassword,
          confirmPassword: testPassword,
          role: 'USER',
          city: 'Mumbai',
          dateOfBirth: '1995-05-15',
          gender: 'MALE',
          relationshipIntent: 'MARRIAGE',
        }),
      });
      registerRes = await resp.json();
    } catch (err) {
      console.error('Failed to connect to backend during registration:', err.message);
    }

    assert(registerRes && registerRes.success === true, 'Registration succeeded with success: true');
    assert(registerRes && registerRes.requiresOtp === true, 'Response specifies requiresOtp: true');
    assert(registerRes && registerRes.devOtp === undefined, 'Security: devOtp is NOT present in response');
    assert(registerRes && registerRes.otp === undefined, 'Security: Plaintext OTP is NOT present in response');
    assert(
      registerRes && registerRes.message && registerRes.message.includes('sent to your email'),
      'Safe user confirmation message returned'
    );

    // -------------------------------------------------------------
    // Scenario 3: Verify Secure Persistent Storage in Database
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Checking OTP storage in Database ---');
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { email: testEmail, purpose: 'REGISTRATION' },
      orderBy: { createdAt: 'desc' },
    });

    assert(otpRecord !== null, 'OTP record persisted in PostgreSQL OtpVerification table');
    assert(otpRecord && otpRecord.otpHash && otpRecord.otpHash.startsWith('$2'), 'OTP stored as bcrypt hash');
    assert(otpRecord && otpRecord.verified === false, 'OTP verified status is initially false');
    assert(otpRecord && otpRecord.attempts === 0, 'Initial attempts count is 0');
    assert(
      otpRecord && new Date(otpRecord.expiresAt) > new Date(),
      'OTP expiration is properly set in the future'
    );

    const expiryDiffMinutes = (new Date(otpRecord.expiresAt) - new Date(otpRecord.createdAt)) / 60000;
    assert(
      Math.round(expiryDiffMinutes) === 5,
      `Expiration period is exactly 5 minutes (calculated: ${expiryDiffMinutes.toFixed(2)} min)`
    );

    // -------------------------------------------------------------
    // Scenario 4: Resend Cooldown Enforcement (Backend)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Testing Resend Cooldown Enforcement ---');
    const resendCooldownResp = await fetch(`${BASE_URL}/api/auth/resend-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const resendCooldownData = await resendCooldownResp.json();
    assert(resendCooldownResp.status === 429, 'Immediate resend rejected with HTTP 429 Too Many Requests');
    assert(
      resendCooldownData.message && resendCooldownData.message.includes('Please wait'),
      `Cooldown message returned: "${resendCooldownData.message}"`
    );

    // -------------------------------------------------------------
    // Scenario 5: Incorrect OTP verification & attempt tracking
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Testing Incorrect OTP Verification & Attempt Tracking ---');
    const wrongOtpResp = await fetch(`${BASE_URL}/api/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' }),
    });
    const wrongOtpData = await wrongOtpResp.json();
    assert(wrongOtpResp.status === 400, 'Wrong OTP rejected with HTTP 400');
    assert(
      wrongOtpData.message && wrongOtpData.message.includes('attempts remaining'),
      `Attempt feedback provided: "${wrongOtpData.message}"`
    );

    const updatedOtpRecord = await prisma.otpVerification.findUnique({
      where: { id: otpRecord.id },
    });
    assert(updatedOtpRecord && updatedOtpRecord.attempts === 1, 'Failed attempt counter incremented in DB (attempts = 1)');

    // -------------------------------------------------------------
    // Scenario 6: Rate Limiting & Auto-invalidation after 5 failed attempts
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Testing Attempt Exhaustion (Max 5 attempts) ---');
    for (let i = 2; i <= 5; i++) {
      await fetch(`${BASE_URL}/api/auth/verify-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, otp: '11111' + i }),
      });
    }

    const exhaustedResp = await fetch(`${BASE_URL}/api/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '123456' }),
    });
    const exhaustedData = await exhaustedResp.json();
    assert(
      exhaustedResp.status === 429 || exhaustedResp.status === 400,
      'Exhausted attempts rejected'
    );

    const invalidatedRecord = await prisma.otpVerification.findUnique({
      where: { id: otpRecord.id },
    });
    assert(
      invalidatedRecord && invalidatedRecord.verified === true,
      'Exhausted OTP record invalidated in database (verified = true)'
    );

    // -------------------------------------------------------------
    // Scenario 7: Expired OTP rejection
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Testing Expired OTP Rejection ---');
    const expiredOtpCode = '888999';
    const expiredHash = await bcrypt.hash(expiredOtpCode, 10);
    const expiredRecord = await prisma.otpVerification.create({
      data: {
        email: testEmail,
        otpHash: expiredHash,
        purpose: 'REGISTRATION',
        expiresAt: new Date(Date.now() - 10000), // 10 seconds in the past
        verified: false,
        attempts: 0,
      },
    });

    const expiredVerifyResp = await fetch(`${BASE_URL}/api/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: expiredOtpCode }),
    });
    const expiredVerifyData = await expiredVerifyResp.json();
    assert(expiredVerifyResp.status === 400, 'Expired OTP rejected with HTTP 400');
    assert(
      expiredVerifyData.message && expiredVerifyData.message.toLowerCase().includes('expired'),
      `Correct expiration error message: "${expiredVerifyData.message}"`
    );

    // -------------------------------------------------------------
    // Scenario 8: Successful OTP Verification & Admin Approval Preservation
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Testing Valid OTP Verification & Workflow Integrity ---');
    const validOtpCode = '765432';
    const validHash = await bcrypt.hash(validOtpCode, 10);

    // Create fresh valid OTP record
    await prisma.otpVerification.create({
      data: {
        email: testEmail,
        otpHash: validHash,
        purpose: 'REGISTRATION',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        verified: false,
        attempts: 0,
      },
    });

    const validVerifyResp = await fetch(`${BASE_URL}/api/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: validOtpCode }),
    });
    const validVerifyData = await validVerifyResp.json();
    assert(validVerifyResp.status === 200, 'Valid OTP verified with HTTP 200');
    assert(validVerifyData.success === true, 'Verification returns success: true');

    const verifiedUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert(verifiedUser.emailVerified === true, 'User emailVerified flag updated to true');
    assert(verifiedUser.isVerified === false, 'User isVerified remains FALSE pending admin review');

    // -------------------------------------------------------------
    // Scenario 9: Replay Attack Prevention (Re-using used OTP)
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Testing Replay Attack Prevention ---');
    const replayResp = await fetch(`${BASE_URL}/api/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: validOtpCode }),
    });
    const replayData = await replayResp.json();
    assert(replayResp.status === 400, 'Replay of already-used OTP rejected with HTTP 400');
    assert(
      replayData.message && (replayData.message.includes('No active') || replayData.message.includes('already been used')),
      `Replay safely rejected: "${replayData.message}"`
    );

    // -------------------------------------------------------------
    // Scenario 10: Cross-User Scoping (User A OTP cannot verify User B)
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Testing Cross-User OTP Isolation ---');
    const userBEmail = `userb.${timestamp}@jabwemeet-test.local`;
    const crossVerifyResp = await fetch(`${BASE_URL}/api/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, otp: validOtpCode }),
    });
    assert(crossVerifyResp.status === 400, 'Cross-user verification rejected');

    // Clean up test data
    console.log('\n--- Cleaning up test records ---');
    await prisma.otpVerification.deleteMany({ where: { email: { in: [testEmail, userBEmail] } } });
    await prisma.user.deleteMany({ where: { email: { in: [testEmail, userBEmail] } } });
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
  }
}

runTests();
