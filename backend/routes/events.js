const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/events - List active events
router.get('/', async (req, res) => {
  try {
    const { category, city } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (city) filter.city = city;

    const events = await prisma.event.findMany({
      where: filter,
      orderBy: { date: 'asc' },
    });

    return res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// GET /api/events/host - List events created by the logged-in host
router.get('/host', authenticateToken, requireRole(['ADMIN', 'HOST', 'EVENT_MANAGER']), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { hostId: req.user.id },
      orderBy: { date: 'desc' },
    });

    return res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching host events:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch host events' });
  }
});

// POST /api/events - Create new event (Admin or Host)
router.post('/', authenticateToken, requireRole(['ADMIN', 'HOST', 'EVENT_MANAGER']), async (req, res) => {
  try {
    const { title, description, category, location, city, date, endDate, price, maxAttendees, ageRange, itinerary } = req.body;
    if (!title || !description || !category || !location || !city || !date) {
      return res.status(400).json({ success: false, message: 'Missing required event fields' });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        category,
        location,
        city,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        price: price ? parseFloat(price) : 0,
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : 50,
        ageRange,
        itinerary,
        hostId: req.user.id
      },
    });

    return res.status(201).json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event' });
  }
});

module.exports = router;
