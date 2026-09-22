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

    // Send email to user
    try {
      if (existing.client && existing.client.email) {
        const { sendMail } = require('../services/emailService');
        if (status === 'Approved') {
          await sendMail(
            existing.client.email,
            '💖 Your Matchmaking Request is Approved!',
            `Hello ${existing.client.name},\n\nWOW! Great news! Your relationship manager has accepted your matchmaking request.\nGo check your dashboard to see your new matches and start your journey!\n\nCheers,\nJabWeMeet Team`,
            `<div style="font-family: sans-serif; text-align: center; color: #333;">
               <h1 style="color: #e11d48;">🎉 WOW! Great news! 🎉</h1>
               <p style="font-size: 18px;">Hello <strong>${existing.client.name}</strong>,</p>
               <p style="font-size: 16px;">Your relationship manager has <strong>accepted</strong> your matchmaking request.</p>
               <p style="font-size: 16px;">Go and check your dashboard right away to see what's waiting for you and start your beautiful journey!</p>
               <br><p>Cheers,<br>JabWeMeet Team</p>
             </div>`
          );
        } else if (status === 'Rejected') {
          await sendMail(
            existing.client.email,
            'Update on your Matchmaking Request',
            `Hello ${existing.client.name},\n\nWe wanted to let you know that your relationship manager has unfortunately passed on your matchmaking request at this time.\n\nWarm Regards,\nJabWeMeet Team`,
            `<p>Hello <strong>${existing.client.name}</strong>,</p><p>We wanted to let you know that your relationship manager has unfortunately passed on your matchmaking request at this time.</p><br><p>Warm Regards,<br>JabWeMeet Team</p>`
          );
        }
      }
    } catch (mailError) {
      console.error('Error sending request status email:', mailError);
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
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              score: { type: "INTEGER" },
              reason: { type: "STRING" }
            },
            required: ["id", "score", "reason"]
          }
        }
      }
    });

    let rawText = (response.text || "").trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    let matchesJson = [];
    try {
      matchesJson = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn("Direct JSON.parse failed, attempting extraction regex:", parseErr);
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matchesJson = JSON.parse(jsonMatch[0]);
      } else {
        throw parseErr;
      }
    }

    // Merge in profile images
    const enrichedMatches = matchesJson.map(m => {
      const u = otherUsers.find(ou => ou.id === m.id);
      return {
        ...m,
        name: u?.name || 'Unknown',
        profileImage: u?.profileImage || null
      };
    });

    const existingConns = await prisma.matchSuggestion.findMany({
      where: { OR: [ { clientId: id }, { suggestedProfileId: id } ] }
    });
    const finalMatches = enrichedMatches.map(m => ({
      ...m,
      isConnected: existingConns.some(c => (c.clientId === id && c.suggestedProfileId === m.id) || (c.clientId === m.id && c.suggestedProfileId === id))
    }));
    return res.json({ success: true, matches: finalMatches });

  } catch (error) {
    console.error('Error in AI compatibility:', error);
    // Graceful fallback to prevent UI failure
    try {
      const fallbackMatches = otherUsers.slice(0, 3).map((u, i) => ({
        id: u.id,
        name: u.name,
        profileImage: u.profileImage,
        score: 85 - (i * 5),
        reason: `${u.name} is based in ${u.city || 'your area'} and seeking ${u.relationshipIntent || 'a relationship'}.`
      }));
      const existingConns = await prisma.matchSuggestion.findMany({
        where: { OR: [{ clientId: id }, { suggestedProfileId: id }] }
      });
      const finalMatches = fallbackMatches.map(m => ({
        ...m,
        isConnected: existingConns.some(c => (c.clientId === id && c.suggestedProfileId === m.id) || (c.clientId === m.id && c.suggestedProfileId === id))
      }));
      return res.json({ success: true, matches: finalMatches, isFallback: true });
    } catch (fallbackErr) {
      return res.status(500).json({ success: false, message: 'AI compatibility check failed' });
    }
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

    // Send emails to both clients
    try {
      const client1 = await prisma.user.findUnique({ where: { id: clientId } });
      const client2 = await prisma.user.findUnique({ where: { id: suggestedProfileId } });
      
      const { sendMail } = require('../services/emailService');
      
      if (client1 && client1.email) {
        await sendMail(
          client1.email,
          'New Connection Request - JabWeMeet',
          `Hello ${client1.name},\n\nYou have a new connection request from ${client2.name}. Please go and check your dashboard to view the request.\n\nBest Regards,\nJabWeMeet Team`,
          `<p>Hello <strong>${client1.name}</strong>,</p><p>You have a new connection request from <strong>${client2.name}</strong>. Please go and check your dashboard to view the request.</p><br><p>Best Regards,<br>JabWeMeet Team</p>`
        );
      }
      if (client2 && client2.email) {
        await sendMail(
          client2.email,
          'New Connection Request - JabWeMeet',
          `Hello ${client2.name},\n\nYou have a new connection request from ${client1.name}. Please go and check your dashboard to view the request.\n\nBest Regards,\nJabWeMeet Team`,
          `<p>Hello <strong>${client2.name}</strong>,</p><p>You have a new connection request from <strong>${client1.name}</strong>. Please go and check your dashboard to view the request.</p><br><p>Best Regards,<br>JabWeMeet Team</p>`
        );
      }
    } catch (mailError) {
      console.error('Error sending suggestion emails:', mailError);
    }

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
      },
      include: {
        client: true,
        suggestedProfile: true
      }
    });

    try {
      const { sendMail } = require('../services/emailService');
      const dateStr = new Date(meetingDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
      
      const emailHtml = (userName, partnerName) => `
        <div style="font-family: sans-serif; text-align: center; color: #333;">
          <h1 style="color: #e11d48;">💖 It's a Date! 💖</h1>
          <p style="font-size: 18px;">Hello <strong>${userName}</strong>,</p>
          <p style="font-size: 16px;">Wow! Your relationship manager has fixed a wonderful date for you and <strong>${partnerName}</strong>!</p>
          <div style="background-color: #ffe4e6; padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 400px; text-align: left;">
            <p><strong>📅 Date & Time:</strong> ${dateStr}</p>
            <p><strong>📍 Location:</strong> ${meetingLocation}</p>
            <p><strong>🏛️ Venue:</strong> ${meetingVenue}</p>
            <p><strong>💌 Message:</strong> ${meetingMessage || 'Your first date is on us! Try it for free!'}</p>
          </div>
          <p style="font-size: 18px; font-weight: bold; color: #e11d48;">Enjoy your date with your partner!</p>
          <br>
          <p>Best regards,<br>JabWeMeet Matchmaking Team</p>
        </div>
      `;

      const emailText = (userName, partnerName) => `Hello ${userName},\n\nWow! Your relationship manager has fixed a wonderful date for you and ${partnerName}!\n\nDate & Time: ${dateStr}\nLocation: ${meetingLocation}\nVenue: ${meetingVenue}\nMessage: ${meetingMessage || 'Your first date is on us! Try it for free!'}\n\nEnjoy your date with your partner!\n\nBest regards,\nJabWeMeet Matchmaking Team`;

      if (connection.client?.email) {
        await sendMail(
          connection.client.email,
          "💖 Your Date is Fixed! 💖",
          emailText(connection.client.name, connection.suggestedProfile.name),
          emailHtml(connection.client.name, connection.suggestedProfile.name)
        );
      }

      if (connection.suggestedProfile?.email) {
        await sendMail(
          connection.suggestedProfile.email,
          "💖 Your Date is Fixed! 💖",
          emailText(connection.suggestedProfile.name, connection.client.name),
          emailHtml(connection.suggestedProfile.name, connection.client.name)
        );
      }
    } catch (mailError) {
      console.error('Error sending date fixed emails:', mailError);
    }

    res.json({ success: true, connection });
  } catch (error) {
    console.error('Error setting date:', error);
    res.status(500).json({ success: false, message: 'Failed to set date.' });
  }
});

// Fetch RM Earnings
router.get('/earnings', async (req, res) => {
  try {
    const { matchmakerId } = req.query;
    if (!matchmakerId) {
      return res.status(400).json({ success: false, message: 'matchmakerId required' });
    }

    const earnings = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Payment" 
      WHERE "userId" = $1 AND "type" = 'RM_EARNING_DATING' 
      ORDER BY "createdAt" DESC
    `, matchmakerId);

    res.json({ success: true, earnings });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
  }
});

// Fetch Feedbacks for RM's matches
router.get('/feedbacks', async (req, res) => {
  try {
    const { matchmakerId } = req.query;
    if (!matchmakerId) {
      return res.status(400).json({ success: false, message: 'matchmakerId required' });
    }

    // Ensure table exists just in case
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DateFeedback" (
        "id" TEXT NOT NULL,
        "matchId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "gender" TEXT,
        "rating" INTEGER NOT NULL,
        "feedback" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "sentiment" TEXT DEFAULT 'NEUTRAL',
        CONSTRAINT "DateFeedback_pkey" PRIMARY KEY ("id")
      );
    `);

    // Fetch feedbacks where the match belongs to this RM
    const feedbacks = await prisma.$queryRawUnsafe(`
      SELECT f.*, u."name" as "userName", u."profileImage" as "userImage"
      FROM "DateFeedback" f
      JOIN "MatchSuggestion" m ON f."matchId" = m."id"
      JOIN "User" u ON f."userId" = u."id"
      WHERE m."matchmakerId" = $1
      ORDER BY f."createdAt" DESC
    `, matchmakerId);

    res.json({ success: true, feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feedbacks' });
  }
});

// Delete a negative feedback
router.delete('/feedbacks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$executeRawUnsafe(`DELETE FROM "DateFeedback" WHERE "id" = $1`, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, message: 'Failed to delete feedback' });
  }
});

// Toggle Publish status of a feedback
router.patch('/feedbacks/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    
    // Create column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DateFeedback" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT FALSE
    `);

    await prisma.$executeRawUnsafe(`
      UPDATE "DateFeedback" SET "isPublished" = $1 WHERE "id" = $2
    `, isPublished, id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error publishing feedback:', error);
    res.status(500).json({ success: false, message: 'Failed to publish feedback' });
  }
});

// GET /api/matchmaker/availability — fetch availability schedule, status & blocked dates
router.get('/availability', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        isAvailableForRequests: true,
        weeklySchedule: true,
        blockedDates: true,
        availableDays: true,
        availableTimeStart: true,
        availableTimeEnd: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        isAvailableForRequests: user.isAvailableForRequests ?? true,
        weeklySchedule: user.weeklySchedule || [],
        blockedDates: user.blockedDates || [],
        availableDays: user.availableDays || [],
        availableTimeStart: user.availableTimeStart || '',
        availableTimeEnd: user.availableTimeEnd || '',
      }
    });
  } catch (error) {
    console.error('Fetch availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
});

// PUT /api/matchmaker/availability — update availability schedule, status & blocked dates
router.put('/availability', async (req, res) => {
  try {
    const { isAvailableForRequests, weeklySchedule, blockedDates, availableDays, availableTimeStart, availableTimeEnd } = req.body;
    
    const updateData = {};
    if (typeof isAvailableForRequests === 'boolean') updateData.isAvailableForRequests = isAvailableForRequests;
    if (weeklySchedule !== undefined) updateData.weeklySchedule = weeklySchedule;
    if (Array.isArray(blockedDates)) updateData.blockedDates = blockedDates;
    if (Array.isArray(availableDays)) updateData.availableDays = availableDays;
    if (availableTimeStart !== undefined) updateData.availableTimeStart = availableTimeStart;
    if (availableTimeEnd !== undefined) updateData.availableTimeEnd = availableTimeEnd;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        isAvailableForRequests: true,
        weeklySchedule: true,
        blockedDates: true,
        availableDays: true,
        availableTimeStart: true,
        availableTimeEnd: true,
      }
    });

    res.json({
      success: true,
      message: 'Availability schedule updated successfully!',
      data: {
        isAvailableForRequests: updatedUser.isAvailableForRequests,
        weeklySchedule: updatedUser.weeklySchedule || [],
        blockedDates: updatedUser.blockedDates || [],
        availableDays: updatedUser.availableDays || [],
        availableTimeStart: updatedUser.availableTimeStart || '',
        availableTimeEnd: updatedUser.availableTimeEnd || '',
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to update availability schedule' });
  }
});

module.exports = router;
