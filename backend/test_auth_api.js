async function test() {
  const baseUrl = 'http://localhost:5001/api/auth';

  console.log('--- 1. Testing check-email (existing: rohan@jabweemeet.com) ---');
  let res = await fetch(`${baseUrl}/check-email?email=rohan@jabweemeet.com`);
  let data = await res.json();
  console.log('check-email (existing):', res.status, data);

  console.log('\n--- 2. Testing check-email (available: priya@example.com) ---');
  res = await fetch(`${baseUrl}/check-email?email=priya@example.com`);
  data = await res.json();
  console.log('check-email (available):', res.status, data);

  console.log('\n--- 3. Testing login (wrong password) ---');
  res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'rohan@jabweemeet.com', password: 'wrongpassword' }),
  });
  data = await res.json();
  console.log('login (wrong password):', res.status, data);

  console.log('\n--- 4. Testing login (correct password) ---');
  res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'rohan@jabweemeet.com', password: 'JabWeMeet@2026' }),
  });
  const cookieHeader = res.headers.get('set-cookie');
  data = await res.json();
  console.log('login (correct password):', res.status, data, 'Set-Cookie present:', !!cookieHeader);

  const token = data.token;

  console.log('\n--- 5. Testing /me (unauthenticated) ---');
  res = await fetch(`${baseUrl}/me`);
  data = await res.json();
  console.log('/me (unauthenticated):', res.status, data);

  console.log('\n--- 6. Testing /me (authenticated with Bearer token) ---');
  res = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  console.log('/me (authenticated):', res.status, data);

  console.log('\n--- 7. Testing registration (real new user: Ananya Iyer) ---');
  const testEmail = `ananya_${Date.now()}@example.com`;
  const testPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  res = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ananya Iyer',
      email: testEmail,
      phone: testPhone,
      password: 'StrongPass@2026!',
      confirmPassword: 'StrongPass@2026!',
      dateOfBirth: '1998-04-12',
      city: 'Bangalore',
      gender: 'Female',
      relationshipIntent: 'Relationship',
    }),
  });
  data = await res.json();
  console.log('register (success):', res.status, data);

  console.log('\n--- 8. Testing registration (duplicate email conflict) ---');
  res = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Test',
      email: testEmail,
      phone: '+919999999999',
      password: 'StrongPass@2026!',
      confirmPassword: 'StrongPass@2026!',
      dateOfBirth: '1998-04-12',
      city: 'Mumbai',
    }),
  });
  data = await res.json();
  console.log('register (duplicate conflict):', res.status, data);

  console.log('\n--- 9. Testing registration (under 18 validation) ---');
  res = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Underage User',
      email: 'underage@example.com',
      phone: '+919888888888',
      password: 'StrongPass@2026!',
      confirmPassword: 'StrongPass@2026!',
      dateOfBirth: '2015-01-01',
      city: 'Delhi',
    }),
  });
  data = await res.json();
  console.log('register (underage):', res.status, data);

  console.log('\n--- 10. Testing logout ---');
  res = await fetch(`${baseUrl}/logout`, { method: 'POST' });
  data = await res.json();
  console.log('logout:', res.status, data);

  console.log('\nAll auth backend integration tests completed!');
}

test().catch(console.error);
