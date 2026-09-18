const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all matchmaker routes
router.use(authenticateToken);
router.use(requireRole(['MATCHMAKER', 'ADMIN']));

// GET /api/matchmaker/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const matchmakerId = req.user.userId;

    // Fetch basic matchmaker details
    const manager = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
      }
    });

    // 1. Fetch assigned clients
    const assignedClients = await prisma.user.findMany({
      where: {
        assignedManagerId: matchmakerId,
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        dateOfBirth: true,
        city: true,
        // using isVerified/isApproved as status proxies for demo
        isVerified: true, 
        updatedAt: true,
      },
      take: 10,
    });

    // Format clients
    const formattedClients = assignedClients.map(c => {
      const age = c.dateOfBirth ? Math.floor((new Date() - new Date(c.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 25;
      return {
        id: c.id,
        name: c.name,
        profileImage: c.profileImage,
        age: age,
        city: c.city,
        status: c.isVerified ? 'Active' : 'In Progress',
        lastActivity: c.updatedAt
      };
    });

    // 2. Fetch pending requests
    const pendingRequests = await prisma.matchmakingRequest.findMany({
      where: {
        status: 'New',
        // In real app, filter by manager assignments or city
      },
      include: {
        client: {
          select: {
            name: true,
            profileImage: true,
            dateOfBirth: true,
            city: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formattedRequests = pendingRequests.map(r => {
      const age = r.client.dateOfBirth ? Math.floor((new Date() - new Date(r.client.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 25;
      return {
        id: r.id,
        clientId: r.clientId,
        clientName: r.client.name,
        profileImage: r.client.profileImage,
        age: age,
        city: r.client.city,
        lookingFor: r.lookingFor || 'Partner',
        status: r.status,
        createdAt: r.createdAt
      };
    });

    // 3. Fetch upcoming schedule
    const schedule = await prisma.appointment.findMany({
      where: {
        matchmakerId: matchmakerId,
        date: {
          gte: new Date(new Date().setHours(0,0,0,0))
        }
      },
      include: {
        client: {
          select: { name: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ],
      take: 5,
    });

    const formattedSchedule = schedule.map(s => ({
      id: s.id,
      clientName: s.client.name,
      date: s.date,
      time: s.time,
      type: s.type,
      mode: s.mode,
      status: s.status
    }));

    // 4. Fetch recent conversations
    const conversations = await prisma.conversation.findMany({
      where: { matchmakerId: matchmakerId },
      include: {
        client: { select: { name: true, profileImage: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: { where: { isRead: false, senderId: { not: matchmakerId } } } }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const formattedMessages = conversations.map(c => ({
      id: c.id,
      clientName: c.client.name,
      profileImage: c.client.profileImage,
      lastMessage: c.messages[0]?.content || '',
      timestamp: c.messages[0]?.createdAt || c.updatedAt,
      unreadCount: c._count.messages
    }));

    // Counts for KPI cards
    const stats = {
      assignedClients: await prisma.user.count({ where: { assignedManagerId: matchmakerId } }),
      pendingRequests: await prisma.matchmakingRequest.count({ where: { status: 'New' } }),
      suggestions: await prisma.matchSuggestion.count({ where: { matchmakerId: matchmakerId, status: 'Pending' } }),
      upcomingSchedules: await prisma.appointment.count({ where: { matchmakerId: matchmakerId, date: { gte: new Date(new Date().setHours(0,0,0,0)) } } })
    };

    return res.json({
      success: true,
      manager,
      stats,
      assignedClients: formattedClients,
      requests: formattedRequests,
      schedule: formattedSchedule,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
  }
});

// GET /api/matchmaker/requests
// Fetch all matchmaking requests with demographic client details & parsed goals
router.get('/requests', async (req, res) => {
  try {
    const matchmakerId = req.user.userId;
    const { status, search } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    } else {
      where.status = { not: 'Approved' };
    }

    const requests = await prisma.matchmakingRequest.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            dateOfBirth: true,
            city: true,
            gender: true,
            relationshipIntent: true,
            assignedManagerId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = requests.map((r) => {
      let parsed = {
        goal: r.lookingFor || 'Long-term Relationship',
        notes: '',
        targetMatchmakerId: null,
        targetMatchmakerName: null,
      };

      if (r.lookingFor && r.lookingFor.startsWith('{')) {
        try {
          const j = JSON.parse(r.lookingFor);
          parsed = {
            goal: j.goal || 'Long-term Relationship',
            notes: j.notes || '',
            targetMatchmakerId: j.matchmakerId || null,
            targetMatchmakerName: j.managerName || null,
          };
        } catch (e) {}
      }

      const age = r.client.dateOfBirth
        ? Math.floor(
            (new Date() - new Date(r.client.dateOfBirth)) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : null;

      return {
        id: r.id,
        clientId: r.clientId,
        clientName: r.client.name,
        clientEmail: r.client.email,
        clientPhone: r.client.phone,
        profileImage: r.client.profileImage,
        age,
        city: r.client.city || 'Pan-India',
        gender: r.client.gender || 'Not specified',
        relationshipIntent: r.client.relationshipIntent || 'Long-term Relationship',
        assignedManagerId: r.client.assignedManagerId,
        goal: parsed.goal,
        notes: parsed.notes,
        targetMatchmakerId: parsed.targetMatchmakerId,
        targetMatchmakerName: parsed.targetMatchmakerName,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    // Optional search query filter
    const filtered = search
      ? formatted.filter(
          (item) =>
            item.clientName.toLowerCase().includes(search.toLowerCase()) ||
            item.city.toLowerCase().includes(search.toLowerCase()) ||
            item.goal.toLowerCase().includes(search.toLowerCase())
        )
      : formatted;

    // Aggregate counts across all requests
    const allRequests = await prisma.matchmakingRequest.findMany({
      select: { status: true },
    });
    const counts = {
      total: allRequests.length,
      new: allRequests.filter((r) => r.status === 'New').length,
      approved: allRequests.filter((r) => r.status === 'Approved').length,
      rejected: allRequests.filter((r) => r.status === 'Rejected').length,
    };

    return res.json({
      success: true,
      counts,
      requests: filtered,
    });
  } catch (error) {
    console.error('Error fetching matchmaker requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to load requests' });
  }
});

// GET /api/matchmaker/clients
// Fetch all clients assigned to this matchmaker
router.get('/clients', async (req, res) => {
  try {
    const matchmakerId = req.user.userId;

    const assignedClients = await prisma.user.findMany({
      where: {
        assignedManagerId: matchmakerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        dateOfBirth: true,
        city: true,
        gender: true,
        relationshipIntent: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedClients = assignedClients.map(c => {
      const age = c.dateOfBirth ? Math.floor((new Date() - new Date(c.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      return {
        ...c,
        age,
        status: c.isVerified ? 'Active' : 'In Progress'
      };
    });

    return res.json({
      success: true,
      clients: formattedClients,
    });
  } catch (error) {
    console.error('Error fetching assigned clients:', error);
    return res.status(500).json({ success: false, message: 'Failed to load clients' });
  }
});

// PATCH /api/matchmaker/requests/:id
// Update request status (e.g. Approved, Rejected) and sync client's assignedManagerId
router.patch('/requests/:id', async (req, res) => {
  try {
    const matchmakerId = req.user.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!['New', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value. Must be New, Approved, or Rejected.' });
    }

    const existing = await prisma.matchmakingRequest.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Update request record status
    const updatedRequest = await prisma.matchmakingRequest.update({
      where: { id },
      data: { status },
    });

    // If Approved, officially link this client to the target matchmaker in the database
    if (status === 'Approved') {
      let targetManagerId = matchmakerId;
      if (existing.lookingFor && existing.lookingFor.startsWith('{')) {
        try {
          const parsed = JSON.parse(existing.lookingFor);
          if (parsed.matchmakerId) targetManagerId = parsed.matchmakerId;
        } catch (e) {}
      }
      await prisma.user.update({
        where: { id: existing.clientId },
        data: { assignedManagerId: targetManagerId },
      });
    } else if (status === 'Rejected') {
      // Unassign client if rejected
      await prisma.user.update({
        where: { id: existing.clientId },
        data: { assignedManagerId: null },
      });
    }

    return res.json({
      success: true,
      message: `Request status updated to ${status}`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

// DELETE /api/matchmaker/requests/:id
// Delete a request and clean up assignment if linked
router.delete('/requests/:id', async (req, res) => {
  try {
    const matchmakerId = req.user.userId;
    const { id } = req.params;

    const existing = await prisma.matchmakingRequest.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // If client was assigned, unassign them
    await prisma.user.update({
      where: { id: existing.clientId },
      data: { assignedManagerId: null },
    });

    await prisma.matchmakingRequest.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete request' });
  }
});

// GET /api/matchmaker/clients/:id/compatibility
// Check AI compatibility with other active users
router.get('/clients/:id/compatibility', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await prisma.user.findUnique({
      where: { id }
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Fetch all other users (for demo, just fetch everyone else)
      const oppositeGender = client.gender?.toLowerCase() === 'male' ? 'Female' : 
                             client.gender?.toLowerCase() === 'female' ? 'Male' : undefined;

      const whereClause = {
        id: { not: id },
        role: 'USER',
      };

      if (oppositeGender) {
        // Prisma might not support mode: 'insensitive' on sqlite, but this is postgres so it does. 
        // For simplicity, we can do a simple equals since data is likely 'Male' or 'Female'.
        // To be safe against case issues, let's just use the exact string, assuming standard casing.
      }

      const otherUsers = await prisma.user.findMany({
        where: oppositeGender ? {
          id: { not: id },
          role: 'USER',
          gender: {
            equals: oppositeGender,
            mode: 'insensitive'
          }
        } : {
          id: { not: id },
          role: 'USER',
          gender: { not: client.gender }
        },
      select: {
        id: true,
        name: true,
        gender: true,
        city: true,
        dateOfBirth: true,
        relationshipIntent: true,
        profileImage: true,
      },
      take: 15
    });

    if (otherUsers.length === 0) {
      return res.json({ success: true, matches: [] });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Mock response if no API key
      const mockMatches = otherUsers.slice(0, 3).map((u, i) => ({
        id: u.id,
        name: u.name,
        profileImage: u.profileImage,
        score: 95 - (i * 5),
        reason: 'Mock compatibility reason due to missing GEMINI_API_KEY.'
      }));
      return res.json({ success: true, matches: mockMatches });
    }

    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const clientProfile = `Name: ${client.name}, Gender: ${client.gender}, City: ${client.city}, Intent: ${client.relationshipIntent}`;
    const candidates = otherUsers.map(u => `ID: ${u.id}, Name: ${u.name}, Gender: ${u.gender}, City: ${u.city}, Intent: ${u.relationshipIntent}`).join('\n');

    const prompt = `
You are an expert matchmaker AI. Analyze the compatibility between the following client and a list of candidates.
Return the top 3 most compatible candidates as a JSON array.
Each object in the array should have:
- "id": The ID of the candidate
- "score": A compatibility score from 0 to 100
- "reason": A short 1-sentence reason for why they match well.

Client:
${clientProfile}

Candidates:
${candidates}

Respond ONLY with valid JSON (an array of objects).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const matchesJson = JSON.parse(response.text);

    // Merge in profile images
    const enrichedMatches = matchesJson.map(m => {
      const u = otherUsers.find(ou => ou.id === m.id);
      return {
        ...m,
        name: u?.name || 'Unknown',
        profileImage: u?.profileImage || null
      };
    });

    const existingConns = await prisma.matchSuggestion.findMany({ where: { OR: [ { clientId: id }, { suggestedProfileId: id } ] } }); const finalMatches = enrichedMatches.map(m => ({ ...m, isConnected: existingConns.some(c => (c.clientId === id && c.suggestedProfileId === m.id) || (c.clientId === m.id && c.suggestedProfileId === id)) })); return res.json({ success: true, matches: finalMatches });

  } catch (error) {
    console.error('Error in AI compatibility:', error);
    return res.status(500).json({ success: false, message: 'AI compatibility check failed' });
  }
});

// Create a new MatchSuggestion
router.post('/suggestions', async (req, res) => {
  try {
    const { clientId, suggestedProfileId, matchmakerId } = req.body;
    
    // Check if already suggested
    const existing = await prisma.matchSuggestion.findFirst({
      where: {
        OR: [
          { clientId, suggestedProfileId },
          { clientId: suggestedProfileId, suggestedProfileId: clientId }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'These profiles have already been connected.' });
    }

    const suggestion = await prisma.matchSuggestion.create({
      data: {
        matchmakerId,
        clientId,
        suggestedProfileId,
        status: 'Pending',
        clientStatus: 'Pending',
        suggestedStatus: 'Pending'
      }
    });

    res.json({ success: true, suggestion });
  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({ success: false, message: 'Failed to create connection request.' });
  }
});

// Get all suggestions created by the matchmaker
router.get('/connections', async (req, res) => {
  try {
    // Ideally use req.user.id but for this matchmaker route we might rely on the token or pass ID.
    // In this codebase, it seems matchmaker is assumed or we can pass matchmakerId. Let's just fetch all or pass ?matchmakerId=...
    const { matchmakerId } = req.query;
    if (!matchmakerId) {
      return res.status(400).json({ success: false, message: 'matchmakerId required' });
    }

    const connections = await prisma.matchSuggestion.findMany({
      where: { matchmakerId },
      include: {
        client: { select: { id: true, name: true, profileImage: true, phone: true } },
        suggestedProfile: { select: { id: true, name: true, profileImage: true, phone: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, connections });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch connections' });
  }
});

// Set a date for a BothApproved connection
router.put('/connections/:id/date', async (req, res) => {
  try {
    const { id } = req.params;
    const { meetingDate, meetingMessage, meetingLocation, meetingVenue } = req.body;

    const connection = await prisma.matchSuggestion.update({
      where: { id },
      data: {
        status: 'DateFixed',
        meetingDate: new Date(meetingDate),
        meetingLocation,
        meetingVenue,
        meetingMessage: meetingMessage || 'Your first date is on us! Try it for free!'
      }
    });

    res.json({ success: true, connection });
  } catch (error) {
    console.error('Error setting date:', error);
    res.status(500).json({ success: false, message: 'Failed to set date.' });
  }
});

module.exports = router;
