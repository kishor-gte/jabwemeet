const express = require("express");
const prisma = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// 1. GET /api/services/relationship-managers (or /api/relationship-managers)
// Fetch all relationship managers who are registered and approved by admin
router.get("/relationship-managers", async (req, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: "MATCHMAKER",
        isApproved: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        gender: true,
        profileImage: true,
        isVerified: true,
        isApproved: true,
        createdAt: true,
        _count: {
          select: {
            assignedClients: true,
            madeSuggestions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      count: managers.length,
      data: managers,
    });
  } catch (error) {
    console.error("Error fetching approved relationship managers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved relationship managers.",
    });
  }
});

// 2. GET /api/services/breakup-buddies (or /api/breakup-buddies)
// Fetch all breakup buddies who are registered and approved by admin
router.get("/breakup-buddies", async (req, res) => {
  try {
    const buddies = await prisma.user.findMany({
      where: {
        role: "BREAKUP_BUDDY",
        isApproved: true,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        phone: true,
        city: true,
        gender: true,
        profilePhoto: true,
        shortBio: true,
        languages: true,
        areasOfExpertise: true,
        sessionTypes: true,
        availableDays: true,
        availableTimeStart: true,
        availableTimeEnd: true,
        isVerified: true,
        isApproved: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      count: buddies.length,
      data: buddies,
    });
  } catch (error) {
    console.error("Error fetching approved breakup buddies:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved breakup buddies.",
    });
  }
});

// 3. POST /api/services/matchmaking-requests
// Submit a new introduction/matchmaking request targeting a Relationship Manager
router.post("/matchmaking-requests", authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId;
    const { matchmakerId, managerName, goal, notes } = req.body;

    if (!matchmakerId) {
      return res.status(400).json({
        success: false,
        message:
          "A relationship manager ID is required to request an introduction.",
      });
    }

    // Verify manager exists and is an approved MATCHMAKER
    const manager = await prisma.user.findFirst({
      where: {
        id: matchmakerId,
        role: "MATCHMAKER",
        isApproved: true,
      },
      select: { id: true, name: true },
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "The requested relationship manager is not currently active.",
      });
    }

    // Structured storage in lookingFor JSON to support rich metadata without breaking schema
    const requestPayload = {
      matchmakerId: manager.id,
      managerName: manager.name,
      goal: goal || "Long-term Relationship",
      notes: notes || "",
      submittedAt: new Date().toISOString(),
    };

    // Check if an existing 'New' request already exists for this client with this manager
    const existing = await prisma.matchmakingRequest.findFirst({
      where: {
        clientId,
        status: "New",
      },
      orderBy: { createdAt: "desc" },
    });

    let resultRequest;
    if (existing) {
      // Update existing pending request with new goals/notes
      resultRequest = await prisma.matchmakingRequest.update({
        where: { id: existing.id },
        data: {
          lookingFor: JSON.stringify(requestPayload),
          status: "New",
        },
      });
    } else {
      // Create fresh request
      resultRequest = await prisma.matchmakingRequest.create({
        data: {
          clientId,
          lookingFor: JSON.stringify(requestPayload),
          status: "New",
        },
      });
    }

    return res.json({
      success: true,
      message: `Introduction request sent to ${manager.name}. You will be notified once reviewed.`,
      data: resultRequest,
    });
  } catch (error) {
    console.error("Error creating matchmaking request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit matchmaking request.",
    });
  }
});

// 4. GET /api/services/my-matchmaking-requests
// Fetch current member's introduction requests and assigned manager status
router.get("/my-matchmaking-requests", authenticateToken, async (req, res) => {
  try {
    const clientId = req.user.userId;

    // Fetch user with assigned manager details
    const user = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        assignedManagerId: true,
        assignedManager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            profileImage: true,
          },
        },
      },
    });

    // Fetch all requests submitted by this client
    const requests = await prisma.matchmakingRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    const formattedRequests = requests.map((r) => {
      let parsed = {
        goal: r.lookingFor || "Long-term Relationship",
        notes: "",
        matchmakerId: null,
        managerName: null,
      };

      if (r.lookingFor && r.lookingFor.startsWith("{")) {
        try {
          const j = JSON.parse(r.lookingFor);
          parsed = {
            goal: j.goal || "Long-term Relationship",
            notes: j.notes || "",
            matchmakerId: j.matchmakerId || null,
            managerName: j.managerName || null,
          };
        } catch (e) {}
      }

      return {
        id: r.id,
        goal: parsed.goal,
        notes: parsed.notes,
        matchmakerId: parsed.matchmakerId,
        managerName: parsed.managerName,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    // Latest active request
    const latestRequest = formattedRequests[0] || null;

    return res.json({
      success: true,
      assignedManager: user?.assignedManager || null,
      latestRequest,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("Error fetching member matchmaking requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load member matchmaking requests.",
    });
  }
});

// 5. POST /api/services/buddy-request
// Submit a request to a Breakup Buddy
router.post("/buddy-request", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { buddyId, sessionFormat, notes } = req.body;

    if (!buddyId) {
      return res
        .status(400)
        .json({ success: false, message: "Buddy ID is required." });
    }

    const buddy = await prisma.user.findFirst({
      where: { id: buddyId, role: "BREAKUP_BUDDY", isApproved: true },
    });

    if (!buddy) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Breakup Buddy not found or unavailable.",
        });
    }

    const format = sessionFormat === "Voice Call" ? "Voice Call" : "Chat";

    const request = await prisma.buddyRequest.create({
      data: {
        userId,
        buddyId,
        sessionType: format,
        topic: notes ? notes.trim() : `1-on-1 ${format} Support Session`,
        status: "Pending",
      },
    });

    return res.json({
      success: true,
      message: "Support session requested successfully!",
      data: request,
    });
  } catch (error) {
    console.error("Error creating buddy request:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit request." });
  }
});

// 6. GET /api/services/my-buddy-requests
// Fetch all buddy requests made by the logged-in user
router.get("/my-buddy-requests", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = await prisma.buddyRequest.findMany({
      where: { userId },
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            phone: true,
            city: true,
            profilePhoto: true,
            shortBio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching user buddy requests:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user buddy requests.",
    });
  }
});
// 7. GET /api/services/buddy-chat/:requestId — fetch messages (user side)
router.get("/buddy-chat/:requestId", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
    if (!request || (request.userId !== userId && request.buddyId !== userId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const messages = await prisma.buddyMessage.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ 
      success: true, 
      data: messages, 
      timeUsedSeconds: request.timeUsedSeconds, 
      chatLimitSeconds: request.chatLimitSeconds,
      voiceCallSeconds: request.voiceCallSeconds,
      voiceCallLimitSeconds: request.voiceCallLimitSeconds
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// 7b. POST /api/services/buddy-away/:requestId — instantly mark away
router.post("/buddy-away/:requestId", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    await prisma.buddyPresence.updateMany({
      where: { requestId, role: 'USER' },
      data: { lastSeen: new Date(Date.now() - 60000) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// 7c. POST /api/services/buddy-subscribe/:requestId — Dummy Payment Success
router.post("/buddy-subscribe/:requestId", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { type, durationSeconds } = req.body || { type: 'chat', durationSeconds: 3600 }; // fallback 1 hour
    
    // Reset limits upon dummy payment
    const updateData = {};
    if (type === 'voice') {
      updateData.voiceCallSeconds = 0;
      updateData.voiceCallLimitSeconds = durationSeconds;
    } else {
      updateData.timeUsedSeconds = 0;
      updateData.chatLimitSeconds = durationSeconds;
    }

    await prisma.buddyRequest.update({
      where: { id: requestId },
      data: updateData
    });

    const updatedRequest = await prisma.buddyRequest.findUnique({ where: { id: requestId } });

    res.json({ 
      success: true, 
      message: "Payment successful and limits upgraded",
      data: updatedRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

// 8. POST /api/services/buddy-chat/:requestId — send message (user side)
router.post("/buddy-chat/:requestId", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text required' });
    }

    const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
    if (!request || request.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const message = await prisma.buddyMessage.create({
      data: {
        requestId,
        senderId: userId,
        senderRole: 'USER',
        text: text.trim(),
      },
    });
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// 9. POST /api/services/buddy-presence/:requestId — heartbeat (user side)
router.post("/buddy-presence/:requestId", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    let request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
    if (!request || request.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.buddyPresence.upsert({
      where: { requestId_role: { requestId, role: 'USER' } },
      update: { lastSeen: new Date() },
      create: { requestId, role: 'USER', lastSeen: new Date() },
    });

    const buddyPresence = await prisma.buddyPresence.findUnique({
      where: { requestId_role: { requestId, role: 'BUDDY' } },
    });
    const threshold = new Date(Date.now() - 15000); // 15s threshold
    const buddyActive = buddyPresence && buddyPresence.lastSeen > threshold;

    if (buddyActive && request.timeUsedSeconds < request.chatLimitSeconds) {
      request = await prisma.buddyRequest.update({
        where: { id: requestId },
        data: { timeUsedSeconds: { increment: 5 } }
      });
    }

    res.json({ success: true, data: { bothActive: buddyActive, timeUsedSeconds: request.timeUsedSeconds, chatLimitSeconds: request.chatLimitSeconds } });
  } catch (error) {
    console.error('Presence error:', error);
    res.status(500).json({ success: false });
  }
});

// 10. GET /api/services/buddy-presence/:requestId — check presence (user side)
router.get("/buddy-presence/:requestId", authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
    if (!request || request.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const threshold = new Date(Date.now() - 30000);
    const [userPresence, buddyPresence] = await Promise.all([
      prisma.buddyPresence.findUnique({ where: { requestId_role: { requestId, role: 'USER' } } }),
      prisma.buddyPresence.findUnique({ where: { requestId_role: { requestId, role: 'BUDDY' } } }),
    ]);

    const userActive = userPresence && userPresence.lastSeen > threshold;
    const buddyActive = buddyPresence && buddyPresence.lastSeen > threshold;

    res.json({ success: true, data: { userActive: !!userActive, buddyActive: !!buddyActive, bothActive: !!(userActive && buddyActive) } });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// 11. GET /api/notifications
// Fetch active platform announcements & broadcasts for users
router.get("/notifications", async (req, res) => {
  try {
    const announcements = await prisma.$queryRawUnsafe(`
      SELECT "id", "title", "message", "type", "targetAudience", "sentBy", "sentAt"
      FROM "NotificationAnnouncement"
      ORDER BY "sentAt" DESC
      LIMIT 25
    `);
    return res.json({ success: true, announcements });
  } catch (error) {
    console.error("Error fetching user announcements:", error);
    return res.status(500).json({ success: false, announcements: [] });
  }
});

// 12. GET /api/services/call-history
// Fetch call history for logged in user
router.get("/call-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const logs = await prisma.callLog.findMany({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        caller: {
          select: { id: true, name: true, email: true, phone: true, profilePhoto: true, displayName: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, phone: true, profilePhoto: true, displayName: true }
        },
        request: {
          select: { id: true, topic: true, sessionType: true, buddyId: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const formattedLogs = logs.map(log => {
      const isOutgoing = log.callerId === userId;
      const otherUser = isOutgoing ? log.receiver : log.caller;
      return {
        id: log.id,
        requestId: log.requestId,
        type: isOutgoing ? "Outgoing" : "Incoming",
        status: log.status, // "MISSED", "COMPLETED", "REJECTED", "BUSY"
        durationSec: log.durationSec,
        startedAt: log.startedAt,
        endedAt: log.endedAt,
        buddy: {
          id: otherUser.id,
          name: otherUser.displayName || otherUser.name,
          phone: otherUser.phone,
          profilePhoto: otherUser.profilePhoto
        },
        request: log.request
      };
    });

    return res.json({ success: true, data: formattedLogs });
  } catch (error) {
    console.error("Error fetching call history:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch call history." });
  }
});

// 13. GET /api/services/content (or /api/content)
// Public endpoint for CMS platform content
router.get("/content", async (req, res) => {
  try {
    const cmsSetting = await prisma.$queryRawUnsafe(`
      SELECT "value" FROM "SystemSetting" WHERE "key" = 'platform_cms' LIMIT 1
    `);
    const content = cmsSetting[0]?.value || {
      heroHeadline: "Not another dating app. A reason to meet.",
      heroSubheadline: "Tired of endless swiping and conversations that never become real meetings? JabWeMeet creates opportunities to meet people offline through curated events, experiences and genuine human connections.",
      aboutText: "JabWeMeet is built on the truth that real chemistry happens in the real world. We combine safe real-world events, dedicated Relationship Managers, and empathetic Breakup Buddies.",
      safetyPledge: "Every member profile is verified. Every event is hosted by background-vetted hosts in partner venues. Zero tolerance for harassment.",
      announcementBanner: "Welcome to JabWeMeet! Discover upcoming mixers and curated blind dinner dates in your city.",
    };
    return res.json({ success: true, content });
  } catch (error) {
    console.error("Error fetching public CMS content:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch content" });
  }
});

module.exports = router;



