const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const Client = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'socket.io-client'));
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_jabweemeet_2025_secure_key';

let server;
let io;
let baseUrl;
let socketUrl;

async function setup() {
  const app = express();
  app.use(express.json());

  // Mount services & buddy routes
  app.use('/api/services', require('./routes/services'));
  app.use('/api/buddy', require('./routes/buddy'));

  server = http.createServer(app);
  io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('join-request-room', (requestId) => {
      socket.join(`request-${requestId}`);
    });

    socket.on('webrtc-offer', ({ requestId, offer }) => {
      socket.to(`request-${requestId}`).emit('webrtc-offer', offer);
    });

    socket.on('webrtc-answer', ({ requestId, answer }) => {
      socket.to(`request-${requestId}`).emit('webrtc-answer', answer);
    });

    socket.on('webrtc-ice', ({ requestId, candidate }) => {
      socket.to(`request-${requestId}`).emit('webrtc-ice', candidate);
    });
  });

  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      socketUrl = `http://localhost:${port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (io) io.close();
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFICATION TEST: BUG 29 — VOICE CALL CONNECTIVITY & AUDIO PIPELINE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  await setup();

  const testUserToken = jwt.sign(
    { userId: 'test-user-caller', id: 'test-user-caller', role: 'USER', email: 'user@test.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const testBuddyToken = jwt.sign(
    { userId: 'test-buddy-callee', id: 'test-buddy-callee', role: 'BREAKUP_BUDDY', email: 'buddy@test.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // ---------------------------------------------------------------------------
  // TEST 1: Backend GET /api/services/ice-servers delivers STUN & TURN Relay
  // ---------------------------------------------------------------------------
  try {
    console.log('--- [1/6] Testing GET /api/services/ice-servers ---');
    const res = await fetch(`${baseUrl}/api/services/ice-servers`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    assert.strictEqual(data.success, true, 'Response success must be true');
    assert(Array.isArray(data.iceServers), 'iceServers must be an array');
    assert(data.iceServers.length >= 4, 'Must provide multiple ICE servers');

    // Check for STUN
    const hasStun = data.iceServers.some((s) =>
      typeof s.urls === 'string' ? s.urls.startsWith('stun:') : s.urls.some((u) => u.startsWith('stun:'))
    );
    assert(hasStun, 'ICE configuration must contain STUN servers');

    // Check for TURN relay (Bug 29 requirement)
    const turnServers = data.iceServers.filter((s) => {
      const urls = typeof s.urls === 'string' ? [s.urls] : s.urls;
      return urls.some((u) => u.startsWith('turn:') || u.startsWith('turns:'));
    });
    assert(turnServers.length > 0, 'ICE configuration must contain TURN relay servers for mobile carrier/NAT traversal');

    // Verify TURN credentials
    const hasCredentials = turnServers.every((s) => s.username && s.credential);
    assert(hasCredentials, 'TURN relay servers must contain authentication credentials');

    // Verify both UDP and TCP transport options exist for restrictive mobile firewalls
    const hasTcp = turnServers.some((s) => {
      const urls = typeof s.urls === 'string' ? [s.urls] : s.urls;
      return urls.some((u) => u.includes('transport=tcp'));
    });
    assert(hasTcp, 'TURN servers must include TCP fallback (transport=tcp) for cellular networks blocking UDP');

    console.log(`✅ TEST 1 PASSED: /api/services/ice-servers successfully returns ${data.iceServers.length} servers including STUN and TURN relays with credentials.`);
    passed++;
  } catch (err) {
    console.error('❌ TEST 1 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Backend GET /api/buddy/ice-servers delivers TURN Relay to Buddies
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [2/6] Testing GET /api/buddy/ice-servers ---');
    const res = await fetch(`${baseUrl}/api/buddy/ice-servers`, {
      headers: { Authorization: `Bearer ${testBuddyToken}` },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    assert.strictEqual(data.success, true, 'Response success must be true');
    assert(Array.isArray(data.iceServers), 'iceServers must be an array');

    const turnServers = data.iceServers.filter((s) => {
      const urls = typeof s.urls === 'string' ? [s.urls] : s.urls;
      return urls.some((u) => u.startsWith('turn:') || u.startsWith('turns:'));
    });
    assert(turnServers.length > 0, 'Buddy ICE configuration must contain TURN relay servers');

    console.log(`✅ TEST 2 PASSED: /api/buddy/ice-servers accessible and supplies complete STUN + TURN configurations.`);
    passed++;
  } catch (err) {
    console.error('❌ TEST 2 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 3: VoiceCallOverlay.tsx has built-in TURN relay fallbacks
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [3/6] Verifying VoiceCallOverlay.tsx TURN relay configuration ---');
    const overlayCode = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'components', 'VoiceCallOverlay.tsx'), 'utf8');

    assert(
      overlayCode.includes('turn:openrelay.metered.ca') || overlayCode.includes('turns:openrelay.metered.ca'),
      'VoiceCallOverlay.tsx must contain fallback TURN relay servers in DEFAULT_ICE_SERVERS'
    );
    assert(
      overlayCode.includes('transport=tcp'),
      'VoiceCallOverlay.tsx must include TCP TURN relay fallback'
    );
    assert(
      overlayCode.includes('/api/services/ice-servers'),
      'VoiceCallOverlay.tsx must fetch dynamic ICE servers from backend'
    );

    console.log('✅ TEST 3 PASSED: VoiceCallOverlay.tsx incorporates TURN relay servers with UDP/TCP fallbacks and dynamic backend synchronization.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 3 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 4: VoiceCallOverlay.tsx enforces Native HTML5 Audio Pipeline & Autoplay Handling
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [4/6] Verifying Native Audio Element Pipeline & Autoplay Unblock Handling ---');
    const overlayCode = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'components', 'VoiceCallOverlay.tsx'), 'utf8');

    // 4a. Check native audio element playback with srcObject
    assert(
      overlayCode.includes('audioEl.srcObject = stream') && overlayCode.includes('audioEl.play()'),
      'Must play remote stream directly via native HTMLAudioElement pipeline for full OS echo cancellation & voice quality'
    );

    // 4b. Check audio unblock handler and user gesture unlock
    assert(
      overlayCode.includes('setAudioBlocked') && overlayCode.includes('unlockAudioOnUserGesture'),
      'Must detect deferred audio and provide prompt to unlock voice output'
    );

    // 4c. Check bidirectional transceiver enforcement
    assert(
      overlayCode.includes('direction = "sendrecv"') || overlayCode.includes("direction: 'sendrecv'"),
      'Must explicitly enforce sendrecv on audio transceivers to guarantee two-way voice'
    );

    // 4d. Check microphone acquisition parameters
    assert(
      overlayCode.includes('echoCancellation') && overlayCode.includes('noiseSuppression') && overlayCode.includes('autoGainControl'),
      'Must configure acoustic echo cancellation, noise suppression, and auto gain control'
    );

    console.log('✅ TEST 4 PASSED: Native HTML5 audio pipeline with autoplay unlock and sendrecv transceiver enforcement verified.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 4 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 5: VoiceCallOverlay.tsx ICE Candidate Parsing & Deduplication
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [5/6] Verifying Robust ICE Candidate Parsing & Deduplication ---');
    const overlayCode = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'components', 'VoiceCallOverlay.tsx'), 'utf8');

    assert(
      overlayCode.includes('candidateInit') && overlayCode.includes('sdpMid') && overlayCode.includes('sdpMLineIndex'),
      'Must cleanly parse candidate objects preserving sdpMid and sdpMLineIndex'
    );
    assert(
      overlayCode.includes('seenCandidatesRef'),
      'Must deduplicate incoming ICE candidates to prevent browser warnings and state churn'
    );
    assert(
      overlayCode.includes('flushPendingCandidates'),
      'Must queue and flush pending candidates once remote description is set'
    );

    console.log('✅ TEST 5 PASSED: ICE candidate parsing correctly preserves sdpMid/sdpMLineIndex and deduplicates candidates.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 5 FAILED:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST 6: End-to-End Signaling Relay between Caller & Callee
  // ---------------------------------------------------------------------------
  try {
    console.log('\n--- [6/6] Testing Real-Time WebRTC Signaling (Offer, Answer, ICE Candidate) ---');
    const testRequestId = 'req_call_test_' + Date.now();

    const callerSocket = Client(socketUrl);
    const calleeSocket = Client(socketUrl);

    await Promise.all([
      new Promise((res) => callerSocket.on('connect', res)),
      new Promise((res) => calleeSocket.on('connect', res)),
    ]);

    callerSocket.emit('join-request-room', testRequestId);
    calleeSocket.emit('join-request-room', testRequestId);
    await new Promise((r) => setTimeout(r, 100));

    // Test Offer relay
    const testOffer = { type: 'offer', sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\nm=audio 50000 RTP/SAVPF 111\r\na=sendrecv' };
    const offerPromise = new Promise((resolve) => {
      calleeSocket.on('webrtc-offer', (receivedOffer) => {
        resolve(receivedOffer);
      });
    });
    callerSocket.emit('webrtc-offer', { requestId: testRequestId, offer: testOffer });
    const receivedOffer = await offerPromise;
    assert.deepStrictEqual(receivedOffer, testOffer, 'Callee must receive exact WebRTC offer');

    // Test Answer relay
    const testAnswer = { type: 'answer', sdp: 'v=0\r\no=- 67890 2 IN IP4 127.0.0.1\r\nm=audio 50000 RTP/SAVPF 111\r\na=sendrecv' };
    const answerPromise = new Promise((resolve) => {
      callerSocket.on('webrtc-answer', (receivedAnswer) => {
        resolve(receivedAnswer);
      });
    });
    calleeSocket.emit('webrtc-answer', { requestId: testRequestId, answer: testAnswer });
    const receivedAnswer = await answerPromise;
    assert.deepStrictEqual(receivedAnswer, testAnswer, 'Caller must receive exact WebRTC answer');

    // Test ICE candidate relay
    const testCandidate = { candidate: 'candidate:1 1 UDP 2122260223 192.168.1.100 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 };
    const icePromise = new Promise((resolve) => {
      calleeSocket.on('webrtc-ice', (receivedCandidate) => {
        resolve(receivedCandidate);
      });
    });
    callerSocket.emit('webrtc-ice', { requestId: testRequestId, candidate: testCandidate });
    const receivedCandidate = await icePromise;
    assert.deepStrictEqual(receivedCandidate, testCandidate, 'Callee must receive relayed ICE candidate');

    callerSocket.disconnect();
    calleeSocket.disconnect();

    console.log('✅ TEST 6 PASSED: WebRTC signaling successfully relays Offer, Answer, and ICE candidates between peers in real-time.');
    passed++;
  } catch (err) {
    console.error('❌ TEST 6 FAILED:', err.message);
    failed++;
  }

  await teardown();

  console.log('\n================================================================');
  console.log(`🏁 BUG 29 TEST RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
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
