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
    const { buddyId, sessionFormat, preferredMode, notes } = req.body;

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

    const request = await prisma.buddyRequest.create({
      data: {
        userId,
        buddyId,
        sessionType: preferredMode || "Private Voice Call",
        topic: notes ? `${sessionFormat} | ${notes}` : sessionFormat,
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

// 7. GET /api/notifications
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

module.exports = router;


