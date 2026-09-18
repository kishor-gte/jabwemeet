const express = require('express');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/events - List active events
router.get('/', async (req, res) => {
  try {
    const { category, city } = req.query;
    const filter = {};
    if (category && category !== 'All') {
      filter.category = { equals: category, mode: 'insensitive' };
    }
    if (city && city !== 'All') {
      filter.city = { equals: city, mode: 'insensitive' };
    }

    const events = await prisma.event.findMany({
      where: filter,
      include: {
        host: {
          select: { name: true, city: true }
        },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          select: { spots: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Add confirmedBookings count to each event
    const eventsWithCount = events.map(ev => ({
      ...ev,
      confirmedBookings: ev.bookings.reduce((acc, b) => acc + (b.spots || 1), 0),
    }));

    return res.json({ success: true, events: eventsWithCount });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// GET /api/events/host - List events created by the logged-in host
router.get('/host', authenticateToken, requireRole(['ADMIN', 'HOST', 'EVENT_MANAGER']), async (req, res) => {
  try {
    const hostId = req.user.userId || req.user.id;
    const events = await prisma.event.findMany({
      where: { hostId },
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

    const hostId = req.user.userId || req.user.id;

    // SUBSCRIPTION CHECK
    let sub = await prisma.hostSubscription.findFirst({
      where: { hostId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      // Auto-grant starter plan for first-time hosts
      sub = await prisma.hostSubscription.create({
        data: {
          hostId,
          plan: 'STARTER',
          maxEvents: 1,
          eventsUsed: 0,
          expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // ~100 years
          amountPaid: 0,
          status: 'ACTIVE',
        },
      });
    }

    if (sub.expiresAt < new Date()) {
      await prisma.hostSubscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(403).json({ success: false, message: 'Subscription expired. Please upgrade your plan.' });
    }

    if (sub.eventsUsed >= sub.maxEvents) {
      return res.status(403).json({ success: false, message: 'Event limit reached on your current plan. Please upgrade to host more events.' });
    }

    // Increment used events
    await prisma.hostSubscription.update({
      where: { id: sub.id },
      data: { eventsUsed: { increment: 1 } },
    });

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
        hostId,
      },
    });

    return res.status(201).json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Host edits an event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, location, city, date, endDate, price, maxAttendees, ageRange, itinerary } = req.body;
    const hostId = req.user.userId || req.user.id;

    // Check if event exists and belongs to host
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (existingEvent.hostId !== hostId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this event' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
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
      },
    });

    return res.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Host deletes an event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId || req.user.id;

    // Check if event exists and belongs to host
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (existingEvent.hostId !== hostId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this event' });
    }

    await prisma.event.delete({ where: { id } });
    return res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

// POST /api/events/:id/book - Member reserves a spot
router.post('/:id/book', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { spots = 1 } = req.body;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const totalBooked = event.bookings.filter(b => b.status !== 'CANCELLED').reduce((acc, b) => acc + (b.spots || 1), 0);
    const max = event.maxAttendees || 50;

    if (totalBooked + spots > max) {
      return res.status(400).json({ success: false, message: `Only ${Math.max(0, max - totalBooked)} spots left for this event.` });
    }

    const totalAmount = (event.price || 0) * spots;

    const booking = await prisma.eventBooking.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId,
        },
      },
      update: {
        status: 'CONFIRMED',
        spots,
        totalAmount,
      },
      create: {
        eventId: id,
        userId,
        spots,
        totalAmount,
        status: 'CONFIRMED',
      },
      include: {
        event: true,
        user: {
          select: { id: true, name: true, email: true, phone: true, city: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Spot reserved successfully for ${event.title}! 🎉`,
      booking,
    });
  } catch (error) {
    console.error('Error booking event:', error);
    return res.status(500).json({ success: false, message: 'Failed to reserve spot' });
  }
});

// POST /api/events/:id/cancel - Member cancels their reservation
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const booking = await prisma.eventBooking.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId,
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const updated = await prisma.eventBooking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' },
    });

    return res.json({ success: true, message: 'Reservation cancelled successfully', booking: updated });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
  }
});

// GET /api/events/my-bookings - Get all current user reservations
router.get('/my-bookings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const bookings = await prisma.eventBooking.findMany({
      where: {
        userId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
      include: {
        event: {
          include: {
            host: {
              select: { name: true, city: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET /api/events/host/bookings - Get all attendees/reservations for host's events
router.get('/host/bookings', authenticateToken, requireRole(['ADMIN', 'HOST', 'EVENT_MANAGER']), async (req, res) => {
  try {
    const hostId = req.user.userId || req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const whereClause = isAdmin ? {} : { event: { hostId } };

    const bookings = await prisma.eventBooking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            profilePhoto: true,
            createdAt: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            category: true,
            date: true,
            endDate: true,
            location: true,
            city: true,
            price: true,
            maxAttendees: true,
            hostId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET /api/events/host/stats - Get overview stats for host dashboard
router.get('/host/stats', authenticateToken, requireRole(['ADMIN', 'HOST', 'EVENT_MANAGER']), async (req, res) => {
  try {
    const hostId = req.user.userId || req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const eventWhere = isAdmin ? {} : { hostId };
    const bookingWhere = isAdmin ? {} : { event: { hostId } };

    const [eventsCount, bookings, totalEvents] = await Promise.all([
      prisma.event.count({ where: eventWhere }),
      prisma.eventBooking.findMany({
        where: bookingWhere,
        include: { event: true },
      }),
      prisma.event.findMany({
        where: eventWhere,
        include: {
          bookings: {
            include: {
              user: {
                select: { id: true, name: true, email: true, phone: true, city: true }
              }
            }
          }
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
    const totalAttendees = activeBookings.reduce((acc, b) => acc + (b.spots || 1), 0);
    const checkedInCount = bookings.filter(b => b.status === 'CHECKED_IN').length;
    const totalRevenue = activeBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    return res.json({
      success: true,
      stats: {
        totalEvents: eventsCount,
        totalAttendees,
        checkedInCount,
        totalRevenue,
      },
      events: totalEvents,
    });
  } catch (error) {
    console.error('Error fetching host stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch host stats' });
  }
});

// PATCH /api/events/bookings/:id/status - Update attendee status (Check-in, Confirm, Cancel)
router.patch('/bookings/:id/status', authenticateToken, requireRole(['ADMIN', 'HOST', 'EVENT_MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['CONFIRMED', 'CHECKED_IN', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const hostId = req.user.userId || req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Verify ownership
    const booking = await prisma.eventBooking.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!isAdmin && booking.event.hostId !== hostId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this booking' });
    }

    const updated = await prisma.eventBooking.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, city: true },
        },
        event: true,
      },
    });

    return res.json({ success: true, message: `Attendee status updated to ${status}`, booking: updated });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

module.exports = router;
