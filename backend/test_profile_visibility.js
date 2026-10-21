const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const prisma = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
const BASE_URL = 'http://localhost:5001';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('==========================================================');
  console.log('🧪 JABWEMEET BUG 15 - PROFILE VISIBILITY VERIFICATION TEST');
  console.log('==========================================================\n');

  // Start the server in background if not already started
  require('./index.js');
  await sleep(1500);

  // Fetch two real test users from the database
  const userA = await prisma.user.findFirst({
    where: { role: 'USER', email: 'nehakore@gmail.com' },
  });
  const userB = await prisma.user.findFirst({
    where: { role: 'USER', email: 'rohan@jabweemeet.com' },
  });
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!userA || !userB || !adminUser) {
    throw new Error('Test users (User A, User B, Admin) not found in database.');
  }

  const tokenA = jwt.sign({ userId: userA.id, email: userA.email, role: userA.role }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ userId: userB.id, email: userB.email, role: userB.role }, JWT_SECRET, { expiresIn: '1h' });
  const tokenAdmin = jwt.sign({ userId: adminUser.id, email: adminUser.email, role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });

  console.log(`✓ Test Users Initialized:`);
  console.log(`   User A: ${userA.name} (${userA.email}, ID: ${userA.id})`);
  console.log(`   User B: ${userB.name} (${userB.email}, ID: ${userB.id})`);
  console.log(`   Admin:  ${adminUser.name} (${adminUser.email})\n`);

  // ----------------------------------------------------
  // TEST 1: Fetch initial profile & visibility settings
  // ----------------------------------------------------
  console.log('--- TEST 1: GET /api/auth/me and GET /api/auth/profile ---');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const meData = await meRes.json();
  if (!meData.success || !meData.user) {
    throw new Error(`TEST 1 Failed: GET /api/auth/me response invalid: ${JSON.stringify(meData)}`);
  }
  console.log('✓ GET /api/auth/me returned visibility settings:');
  console.log(`   profileVisibility: ${meData.user.profileVisibility}`);
  console.log(`   allowRmMatchmaking: ${meData.user.allowRmMatchmaking}`);
  console.log(`   showAgePublicly: ${meData.user.showAgePublicly}`);
  console.log(`   showHometownPublicly: ${meData.user.showHometownPublicly}`);
  console.log(`   cityVisibility: ${meData.user.cityVisibility}`);

  const profileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const profileData = await profileRes.json();
  if (!profileData.success || !profileData.user) {
    throw new Error(`TEST 1 Failed: GET /api/auth/profile failed: ${JSON.stringify(profileData)}`);
  }
  console.log('✓ GET /api/auth/profile succeeded.\n');

  // ----------------------------------------------------
  // TEST 2: Update Visibility Settings and Persist in Database
  // ----------------------------------------------------
  console.log('--- TEST 2: PUT /api/auth/profile - Save Visibility Settings to DB ---');
  const updatePayload = {
    profileVisibility: 'connections_only',
    allowRmMatchmaking: false,
    showAgePublicly: false,
    showHometownPublicly: false,
    cityVisibility: false,
    hometown: 'Pune',
    city: 'Belagvi',
    relationshipIntent: 'Long-term Relationship',
  };

  const putRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify(updatePayload),
  });
  const putData = await putRes.json();

  if (!putRes.ok || !putData.success) {
    throw new Error(`TEST 2 Failed: PUT /api/auth/profile failed: ${JSON.stringify(putData)}`);
  }
  console.log('✓ PUT /api/auth/profile returned success: 200 OK');

  // Verify directly from PostgreSQL database
  const dbUserA = await prisma.user.findUnique({
    where: { id: userA.id },
  });

  if (
    dbUserA.profileVisibility !== 'connections_only' ||
    dbUserA.allowRmMatchmaking !== false ||
    dbUserA.showAgePublicly !== false ||
    dbUserA.showHometownPublicly !== false ||
    dbUserA.cityVisibility !== false ||
    dbUserA.hometown !== 'Pune'
  ) {
    throw new Error(`TEST 2 Failed: Database values do not match updated visibility settings: ${JSON.stringify(dbUserA)}`);
  }
  console.log('✓ Direct PostgreSQL database verification passed:');
  console.log(`   DB profileVisibility: ${dbUserA.profileVisibility}`);
  console.log(`   DB allowRmMatchmaking: ${dbUserA.allowRmMatchmaking}`);
  console.log(`   DB showAgePublicly: ${dbUserA.showAgePublicly}`);
  console.log(`   DB showHometownPublicly: ${dbUserA.showHometownPublicly}`);
  console.log(`   DB cityVisibility: ${dbUserA.cityVisibility}`);
  console.log(`   DB hometown: ${dbUserA.hometown}\n`);

  // ----------------------------------------------------
  // TEST 3: Multi-Device / Session Persistence
  // ----------------------------------------------------
  console.log('--- TEST 3: Multi-Device / New Session Persistence ---');
  // Generate a brand new token simulating a fresh login from a second device
  const secondDeviceTokenA = jwt.sign(
    { userId: userA.id, email: userA.email, role: userA.role, deviceId: 'iphone_safari_session' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const device2Res = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${secondDeviceTokenA}` },
  });
  const device2Data = await device2Res.json();

  if (
    device2Data.user.profileVisibility !== 'connections_only' ||
    device2Data.user.allowRmMatchmaking !== false ||
    device2Data.user.showAgePublicly !== false ||
    device2Data.user.showHometownPublicly !== false ||
    device2Data.user.cityVisibility !== false ||
    device2Data.user.hometown !== 'Pune'
  ) {
    throw new Error(`TEST 3 Failed: Settings did not persist across sessions: ${JSON.stringify(device2Data.user)}`);
  }
  console.log('✓ New device session successfully retrieved saved settings from database without browser localStorage dependence.\n');

  // ----------------------------------------------------
  // TEST 4: Authorization Safeguard - User can update only own settings
  // ----------------------------------------------------
  console.log('--- TEST 4: Authorization Safeguards (Cannot update other users) ---');
  const unauthorizedPutRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`, // User B
    },
    body: JSON.stringify({
      id: userA.id, // User B trying to alter User A
      profileVisibility: 'all_members',
    }),
  });
  const unauthData = await unauthorizedPutRes.json();

  if (unauthorizedPutRes.status !== 403) {
    throw new Error(`TEST 4 Failed: Expected 403 Forbidden, got ${unauthorizedPutRes.status}: ${JSON.stringify(unauthData)}`);
  }
  console.log(`✓ Unauthorized cross-user update blocked with 403 Forbidden: "${unauthData.message}"`);

  // Verify User A's settings remain untouched in DB
  const verifyUntouched = await prisma.user.findUnique({ where: { id: userA.id } });
  if (verifyUntouched.profileVisibility !== 'connections_only') {
    throw new Error('TEST 4 Failed: User A settings were altered by unauthorized user!');
  }
  console.log('✓ Target user settings remained safely intact in database.\n');

  // ----------------------------------------------------
  // TEST 5: Input Validation & Error Handling
  // ----------------------------------------------------
  console.log('--- TEST 5: Input Validation Error Handling ---');
  const invalidValRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      profileVisibility: 'public_to_all_internet_unrestricted', // Invalid
    }),
  });
  const invalidValData = await invalidValRes.json();

  if (invalidValRes.status !== 400) {
    throw new Error(`TEST 5 Failed: Expected 400 Bad Request, got ${invalidValRes.status}`);
  }
  console.log(`✓ Invalid visibility option correctly rejected with 400 Bad Request: "${invalidValData.message}"\n`);

  // ----------------------------------------------------
  // TEST 6: Enforce Profile Visibility Rules on Backend
  // ----------------------------------------------------
  console.log('--- TEST 6: Enforce Profile Visibility Rules on Backend ---');
  // Scenario A: User A has profileVisibility = 'connections_only'. User B (non-connection) requests profile.
  console.log('Scenario 6A: User B requests User A profile when visibility = connections_only');
  const directReq1 = await fetch(`${BASE_URL}/api/auth/profile/${userA.id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const directData1 = await directReq1.json();
  if (directReq1.status !== 403) {
    throw new Error(`TEST 6A Failed: Expected 403 Forbidden, got ${directReq1.status}: ${JSON.stringify(directData1)}`);
  }
  console.log(`✓ Access blocked with 403 Forbidden: "${directData1.message}"`);

  // Scenario B: User A has profileVisibility = 'event_co_attendees'. User B (not co-attendee) requests profile.
  console.log('\nScenario 6B: User B requests User A profile when visibility = event_co_attendees');
  await prisma.user.update({
    where: { id: userA.id },
    data: { profileVisibility: 'event_co_attendees' },
  });

  const directReq2 = await fetch(`${BASE_URL}/api/auth/profile/${userA.id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const directData2 = await directReq2.json();
  if (directReq2.status !== 403) {
    throw new Error(`TEST 6B Failed: Expected 403 Forbidden, got ${directReq2.status}: ${JSON.stringify(directData2)}`);
  }
  console.log(`✓ Access blocked with 403 Forbidden: "${directData2.message}"`);

  // Scenario C: User A has profileVisibility = 'all_members', but showAgePublicly = false, showHometownPublicly = false, cityVisibility = false.
  console.log('\nScenario 6C: User B requests User A profile when visibility = all_members, but age & hometown hidden');
  await prisma.user.update({
    where: { id: userA.id },
    data: {
      profileVisibility: 'all_members',
      showAgePublicly: false,
      showHometownPublicly: false,
      cityVisibility: false,
    },
  });

  const directReq3 = await fetch(`${BASE_URL}/api/auth/profile/${userA.id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const directData3 = await directReq3.json();
  if (!directReq3.ok || !directData3.success) {
    throw new Error(`TEST 6C Failed: Expected 200 OK, got ${directReq3.status}: ${JSON.stringify(directData3)}`);
  }

  if (directData3.profile.dateOfBirth !== null) {
    throw new Error(`TEST 6C Failed: dateOfBirth leaked when showAgePublicly = false! (${directData3.profile.dateOfBirth})`);
  }
  if (directData3.profile.hometown !== null) {
    throw new Error(`TEST 6C Failed: hometown leaked when showHometownPublicly = false! (${directData3.profile.hometown})`);
  }
  if (directData3.profile.city !== null) {
    throw new Error(`TEST 6C Failed: city leaked when cityVisibility = false! (${directData3.profile.city})`);
  }
  console.log('✓ Profile accessed, with hidden fields dateOfBirth, hometown, and city successfully masked to null.');

  // Scenario D: Admin requests User A profile
  console.log('\nScenario 6D: Admin requests User A profile');
  const adminReq = await fetch(`${BASE_URL}/api/auth/profile/${userA.id}`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  const adminData = await adminReq.json();
  if (!adminReq.ok || !adminData.success || !adminData.profile) {
    throw new Error(`TEST 6D Failed: Admin failed to retrieve profile: ${JSON.stringify(adminData)}`);
  }
  console.log('✓ Admin successfully retrieved user profile with administrative access.\n');

  // ----------------------------------------------------
  // TEST 7: Matchmaker Compatibility Exclusions
  // ----------------------------------------------------
  console.log('--- TEST 7: Matchmaker Compatibility Exclusions ---');
  // Set User A to allowRmMatchmaking = false
  await prisma.user.update({
    where: { id: userA.id },
    data: { allowRmMatchmaking: false },
  });

  const compatRes = await fetch(`${BASE_URL}/api/matchmaker/clients/${userB.id}/compatibility`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const compatData = await compatRes.json();
  if (compatData.success && Array.isArray(compatData.matches)) {
    const leaked = compatData.matches.find((m) => m.id === userA.id);
    if (leaked) {
      throw new Error('TEST 7 Failed: User A with allowRmMatchmaking=false appeared in matchmaker suggestions!');
    }
    console.log('✓ User with allowRmMatchmaking=false correctly excluded from matchmaker suggestions.');
  }

  // Restore User A settings
  await prisma.user.update({
    where: { id: userA.id },
    data: {
      profileVisibility: 'all_members',
      allowRmMatchmaking: true,
      showAgePublicly: true,
      showHometownPublicly: true,
      cityVisibility: true,
    },
  });

  // ----------------------------------------------------
  // TEST 8: Existing Profile Attributes Functionality
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Existing Profile Attributes Functionality ---');
  const regularUpdatePayload = {
    city: 'Bengaluru',
    gender: 'Female',
    relationshipIntent: 'Marriage',
    profileVisibility: 'all_members',
  };

  const regPutRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify(regularUpdatePayload),
  });
  const regPutData = await regPutRes.json();

  if (!regPutRes.ok || !regPutData.success || regPutData.user.city !== 'Bengaluru') {
    throw new Error(`TEST 8 Failed: Regular profile update failed: ${JSON.stringify(regPutData)}`);
  }
  console.log('✓ Existing profile fields (city, gender, relationshipIntent) updated and retrieved seamlessly.');

  console.log('\n==========================================================');
  console.log('🎉 ALL 8 TESTS PASSED SUCCESSFULLY!');
  console.log('==========================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILURE:', err);
  process.exit(1);
});
