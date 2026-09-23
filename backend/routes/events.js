const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendMail } = require('../services/emailService');
const { sendEvent24hReminder } = require('../services/eventReminderService');

const router = express.Router();

function getRazorpayConfig() {
  const parseVal = (v) => {
    if (!v) return '';
    const m = String(v).match(/\$\{[^:]+:(.+)\}/);
    return (m ? m[1] : String(v)).replace(/['"]/g, '').trim();
  };
  const key_id = parseVal(process.env.RAZORPAY_KEY_ID || process.env['razorpay.key.id'] || 'rzp_test_RIlD5bEKRjyn3h');
  const key_secret = parseVal(process.env.RAZORPAY_KEY_SECRET || process.env['razorpay.key.secret'] || 'Ltg6uo9vI8TiFMVfj2cGm4I8');
  return { key_id, key_secret };
}

const razorpayConfig = getRazorpayConfig();
const razorpay = new Razorpay({
  key_id: razorpayConfig.key_id,
  key_secret: razorpayConfig.key_secret,
});

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

    if (title.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Event title must be at least 3 characters' });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Event description must be at least 10 characters' });
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid event start date format' });
    }

    // Must be in the future (allowing 2-minute buffer for submission latency)
    if (eventDate.getTime() < Date.now() - 2 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'Event date cannot be in the past or yesterday. Please select a future date and time.' });
    }

    if (endDate) {
      const endEventDate = new Date(endDate);
      if (isNaN(endEventDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid event end date format' });
      }
      if (endEventDate.getTime() <= eventDate.getTime()) {
        return res.status(400).json({ success: false, message: 'Event return/end date must be after the start date' });
      }
    }

    const parsedPrice = price !== undefined && price !== null ? parseFloat(price) : 0;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Event price cannot be negative' });
    }

    const parsedAttendees = maxAttendees ? parseInt(maxAttendees, 10) : 50;
    if (isNaN(parsedAttendees) || parsedAttendees < 2) {
      return res.status(400).json({ success: false, message: 'Max attendees must be at least 2' });
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
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        city: city.trim(),
        date: eventDate,
        endDate: endDate ? new Date(endDate) : null,
        price: parsedPrice,
        maxAttendees: parsedAttendees,
        ageRange,
        itinerary,
        hostId,
      },
    });

    // Asynchronously notify all users about the new event without blocking response
    (async () => {
      try {
        const users = await prisma.user.findMany({
          where: {
            email: { not: '' },
          },
          select: { id: true, email: true, name: true, status: true },
        });

        // Filter out suspended or banned accounts if status is set
        const activeUsers = users.filter(u => u.status !== 'BANNED' && u.status !== 'SUSPENDED');

        console.log(`📢 [JabWeMeet Broadcast] Found ${activeUsers.length} user(s) to notify for new event "${newEvent.title}".`);

        const formattedDate = new Date(newEvent.date).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const priceDisplay = newEvent.price > 0 ? `₹${newEvent.price}` : 'Free Entry';

        for (const recipient of activeUsers) {
          if (!recipient.email || !recipient.email.includes('@')) continue;

          const emailSubject = `🎉 New Event: ${newEvent.title}!`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #e06d53 0%, #f7a072 100%); padding: 28px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700;">✨ New Event on JabWeMeet!</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">A brand new gathering has just been announced</p>
              </div>
              
              <div style="padding: 24px;">
                <p style="font-size: 15px; color: #333;">Hi <strong>${recipient.name || 'Friend'}</strong>,</p>
                <p style="font-size: 14px; color: #555; line-height: 1.6;">
                  We are excited to share that a new event <strong>"${newEvent.title}"</strong> has just been published in <strong>${newEvent.city}</strong>!
                </p>
                
                <div style="background-color: #fdf6f0; border-left: 4px solid #e06d53; padding: 16px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #e06d53; font-size: 17px;">${newEvent.title}</h3>
                  <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🏷️ Category:</strong> ${newEvent.category}</p>
                  <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📅 Date & Time:</strong> ${formattedDate}</p>
                  <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📍 Location:</strong> ${newEvent.location}, ${newEvent.city}</p>
                  <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎟️ Price:</strong> ${priceDisplay}</p>
                </div>

                <p style="font-size: 14px; color: #666; line-height: 1.5;">
                  ${newEvent.description}
                </p>

                <div style="text-align: center; margin: 30px 0 15px 0;">
                  <a href="http://localhost:3000/events" style="background-color: #e06d53; color: white; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 30px; display: inline-block;">
                    Explore & Book Tickets 👉
                  </a>
                </div>
              </div>

              <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
                Sent with ❤️ from the <strong>JabWeMeet</strong> Team.<br/>
                You received this email because you have an account on JabWeMeet.
              </div>
            </div>
          `;

          try {
            await sendMail(recipient.email, emailSubject, '', emailHtml);
            console.log(`✅ [JabWeMeet Broadcast] Email sent to: ${recipient.email}`);
          } catch (err) {
            console.error(`⚠️ [JabWeMeet Broadcast] Failed to send email to ${recipient.email}:`, err.message || err);
          }
        }
      } catch (broadcastErr) {
        console.error('❌ [JabWeMeet Broadcast Error]:', broadcastErr);
      }
    })();

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

    if (title !== undefined && title.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Event title must be at least 3 characters' });
    }
    if (description !== undefined && description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Event description must be at least 10 characters' });
    }
    if (date) {
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid event start date format' });
      }
      if (eventDate.getTime() < Date.now() - 2 * 60 * 1000) {
        return res.status(400).json({ success: false, message: 'Event date cannot be in the past or yesterday. Please select a future date and time.' });
      }
      if (endDate) {
        const endEventDate = new Date(endDate);
        if (isNaN(endEventDate.getTime()) || endEventDate.getTime() <= eventDate.getTime()) {
          return res.status(400).json({ success: false, message: 'Event return/end date must be after the start date' });
        }
      }
    }
    if (price !== undefined && price !== null) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ success: false, message: 'Event price cannot be negative' });
      }
    }
    if (maxAttendees !== undefined && maxAttendees !== null) {
      const parsedAttendees = parseInt(maxAttendees, 10);
      if (isNaN(parsedAttendees) || parsedAttendees < 2) {
        return res.status(400).json({ success: false, message: 'Max attendees must be at least 2' });
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existingEvent.title,
        description: description !== undefined ? description.trim() : existingEvent.description,
        category: category || existingEvent.category,
        location: location !== undefined ? location.trim() : existingEvent.location,
        city: city !== undefined ? city.trim() : existingEvent.city,
        date: date ? new Date(date) : existingEvent.date,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingEvent.endDate,
        price: price !== undefined ? parseFloat(price) : existingEvent.price,
        maxAttendees: maxAttendees !== undefined ? parseInt(maxAttendees, 10) : existingEvent.maxAttendees,
        ageRange: ageRange !== undefined ? ageRange : existingEvent.ageRange,
        itinerary: itinerary !== undefined ? itinerary : existingEvent.itinerary,
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

// POST /api/events/:id/create-order - Initiate Razorpay order for ticket booking
router.post('/:id/create-order', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const spots = parseInt(req.body.spots, 10) || 1;

    if (spots < 1) {
      return res.status(400).json({ success: false, message: 'Please select at least 1 ticket.' });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { not: 'CANCELLED' } },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const totalBooked = event.bookings.reduce((acc, b) => acc + (b.spots || 1), 0);
    const max = event.maxAttendees || 50;
    const available = Math.max(0, max - totalBooked);

    if (spots > available) {
      return res.status(400).json({
        success: false,
        message: available === 0 ? 'This event is completely sold out.' : `Only ${available} spots remaining for this event.`,
      });
    }

    // Free event handling
    if (!event.price || event.price <= 0) {
      return res.json({
        success: true,
        free: true,
        spots,
        totalAmount: 0,
      });
    }

    const totalAmount = event.price * spots;
    const amountInPaise = Math.round(totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_evt_${id.slice(-6)}_${Date.now()}`,
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (e) {
      console.warn('Razorpay API error, falling back to mock order for dev mode', e);
      order = {
        id: `order_mock_evt_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
      };
    }

    // Record pending payment
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Payment" ("id", "userId", "type", "amount", "currency", "status", "gateway", "referenceId", "description", "createdAt")
        VALUES ($1, $2, 'EVENT_TICKET', $3, 'INR', 'PENDING', 'Razorpay', $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO NOTHING;
      `, `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, userId, totalAmount, order.id, `${spots} Ticket(s) for ${event.title}`);
    } catch (dbErr) {
      console.warn('Payment record insert notice:', dbErr.message);
    }

    return res.json({
      success: true,
      free: false,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: razorpay.key_id,
      spots,
      totalAmount,
    });
  } catch (error) {
    console.error('Error creating event payment order:', error);
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// POST /api/events/:id/verify-payment - Verify Razorpay payment and confirm tickets
router.post('/:id/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, spots: rawSpots } = req.body;
    const spots = parseInt(rawSpots, 10) || 1;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, email: true, phone: true },
        },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Verify signature
    let isSignatureValid = false;
    if (!razorpay_order_id || razorpay_order_id.startsWith('order_mock_') || razorpay_signature === 'mock_signature') {
      isSignatureValid = true;
    } else if (razorpayConfig.key_secret) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.key_secret)
        .update(body.toString())
        .digest('hex');
      isSignatureValid = expectedSignature === razorpay_signature;
    } else {
      isSignatureValid = true;
    }

    if (!isSignatureValid) {
      try {
        await prisma.$executeRawUnsafe(`
          UPDATE "Payment" SET "status" = 'FAILED', "referenceId" = $1 WHERE "referenceId" = $2;
        `, razorpay_payment_id, razorpay_order_id);
      } catch (e) {}
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    const paidAmount = (event.price || 0) * spots;

    // Update payment record to SUCCESS
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "Payment" SET "status" = 'SUCCESS', "referenceId" = $1 WHERE "referenceId" = $2 OR "referenceId" = $1;
      `, razorpay_payment_id, razorpay_order_id);
    } catch (e) {}

    // Check if user already had an existing confirmed booking to accumulate spots
    const existing = await prisma.eventBooking.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });

    const finalSpots = (existing && existing.status !== 'CANCELLED')
      ? (existing.spots + spots)
      : spots;
    const finalAmount = (existing && existing.status !== 'CANCELLED')
      ? ((existing.totalAmount || 0) + paidAmount)
      : paidAmount;

    // Upsert EventBooking as CONFIRMED with actual spots and totalAmount
    const booking = await prisma.eventBooking.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId,
        },
      },
      update: {
        status: 'CONFIRMED',
        spots: finalSpots,
        totalAmount: finalAmount,
      },
      create: {
        eventId: id,
        userId,
        spots: finalSpots,
        totalAmount: finalAmount,
        status: 'CONFIRMED',
      },
      include: {
        event: true,
        user: {
          select: { id: true, name: true, email: true, phone: true, city: true },
        },
      },
    });

    // Create EventRegistration in admin table for check-in & verification
    const ticketCode = `TKT-${event.id.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "EventRegistration" ("id", "eventId", "userId", "ticketCode", "paymentStatus", "status", "createdAt")
        VALUES ($1, $2, $3, $4, 'PAID', 'CONFIRMED', CURRENT_TIMESTAMP)
        ON CONFLICT ("ticketCode") DO NOTHING;
      `, `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, id, userId, ticketCode);
    } catch (regErr) {
      console.warn('Registration record notice:', regErr.message);
    }

    // --- SEND EMAILS TO BOTH ATTENDEE AND EVENT HOST ---
    try {
      let attendee = booking.user;
      if (!attendee || !attendee.email) {
        attendee = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, phone: true, city: true },
        });
      }

      const hostName = event.host?.name || 'Event Organizer';
      const hostEmail = event.host?.email;
      const fromHeader = `${hostName} via JabWeMeet`;

      const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // 1. Email to Attendee (User)
      if (attendee?.email) {
        const attendeeSubject = `🎉 Congrats! Your booking for "${event.title}" was successful!`;
        const attendeeHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🎉 Congrats! Booking Successful!</h1>
              <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">You have successfully booked an event with us</p>
            </div>
            
            <div style="padding: 24px;">
              <p style="font-size: 16px; color: #333;">Hi <strong>${attendee.name || 'Friend'}</strong>,</p>
              <p style="font-size: 15px; color: #444; line-height: 1.6;">
                Congrats! Your booking was successful! You have booked <strong>${spots} ${spots === 1 ? 'ticket' : 'tickets'}</strong> for <strong>"${event.title}"</strong> hosted by <strong>${hostName}</strong>.
              </p>
              
              <div style="background-color: #f6fbf6; border-left: 4px solid #4CAF50; padding: 18px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #2E7D32; font-size: 18px;">📋 Event & Ticket Details</h3>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎉 Event:</strong> ${event.title}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>👤 Host:</strong> ${hostName}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📅 Date & Time:</strong> ${formattedDate}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📍 Venue:</strong> ${event.location}, ${event.city}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎟️ Tickets Booked:</strong> ${spots}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>💰 Amount Paid:</strong> ₹${paidAmount}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎫 Ticket Code:</strong> <span style="font-family: monospace; background: #e8f5e9; padding: 3px 8px; border-radius: 4px; font-weight: bold; color: #1b5e20;">${ticketCode}</span></p>
              </div>

              <div style="background-color: #fcf8e3; border: 1px solid #faebcc; padding: 12px 16px; border-radius: 6px; margin: 15px 0; font-size: 13px; color: #8a6d3b;">
                💬 <em>"Thank you for booking with us! We can't wait to welcome you to the event."</em> — <strong>${hostName}</strong>
              </div>

              <p style="font-size: 14px; color: #666; line-height: 1.5;">
                Please keep this email and your Ticket Code handy for entry at the venue.
              </p>

              <div style="text-align: center; margin: 30px 0 15px 0;">
                <a href="http://localhost:3000/dashboard?tab=events" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 30px; display: inline-block; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
                  View My Bookings & Events 👉
                </a>
              </div>
            </div>

            <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
              Sent on behalf of <strong>${hostName}</strong> via <strong>JabWeMeet</strong> 💖
            </div>
          </div>
        `;

        try {
          await sendMail(attendee.email, attendeeSubject, '', attendeeHtml, fromHeader, hostEmail);
          console.log(`✅ [Booking Email] Successfully sent confirmation to attendee: ${attendee.email}`);
        } catch (err) {
          console.error(`⚠️ [Booking Email] Failed sending to attendee ${attendee.email}:`, err.message || err);
        }
      }

      // 2. Email to Host
      if (event.host?.email) {
        const hostSubject = `🔔 New Booking Alert: ${attendee.name} booked "${event.title}"`;
        const hostHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #e06d53 0%, #f7a072 100%); padding: 28px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🎉 New Attendee Registered!</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">A user just booked tickets for your event</p>
            </div>
            
            <div style="padding: 24px;">
              <p style="font-size: 15px; color: #333;">Hi <strong>${hostName}</strong>,</p>
              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                Great news! <strong>${attendee.name}</strong> has just booked ticket(s) for your upcoming event <strong>"${event.title}"</strong>.
              </p>
              
              <div style="background-color: #fdf6f0; border-left: 4px solid #e06d53; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #e06d53; font-size: 17px;">👤 Attendee Information</h3>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>👤 Name:</strong> ${attendee.name}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📧 Email:</strong> ${attendee.email}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📱 Phone:</strong> ${attendee.phone || 'N/A'}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📍 City:</strong> ${attendee.city || 'N/A'}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎟️ Spots Booked:</strong> ${spots}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>💰 Amount Paid:</strong> ₹${paidAmount}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎫 Ticket Code:</strong> <span style="font-family: monospace; background: #ffeae4; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${ticketCode}</span></p>
              </div>

              <div style="background-color: #fbfbfb; padding: 14px; border-radius: 6px; margin: 15px 0; font-size: 13px; color: #666;">
                <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p>
                <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.location}, ${event.city}</p>
              </div>

              <div style="text-align: center; margin: 30px 0 15px 0;">
                <a href="http://localhost:3000/host/dashboard" style="background-color: #e06d53; color: white; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 30px; display: inline-block;">
                  View Host Dashboard 👉
                </a>
              </div>
            </div>

            <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
              JabWeMeet Host Notification System 💖
            </div>
          </div>
        `;

        try {
          await sendMail(event.host.email, hostSubject, '', hostHtml);
          console.log(`✅ [Host Alert Email] Successfully sent booking alert to host: ${event.host.email}`);
        } catch (err) {
          console.error(`⚠️ [Host Alert Email] Failed sending to host ${event.host.email}:`, err.message || err);
        }
      }
    } catch (err) {
      console.error('❌ [Event Booking Email Error]:', err);
    }

    return res.status(201).json({
      success: true,
      message: `🎉 Success! ${spots} ${spots === 1 ? 'ticket' : 'tickets'} confirmed for "${event.title}".`,
      booking,
    });
  } catch (error) {
    console.error('Error verifying event payment:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify payment and confirm booking.' });
  }
});

// POST /api/events/:id/book - Member reserves spots (Complimentary/Free events only)
router.post('/:id/book', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const spots = parseInt(req.body.spots, 10) || 1;

    if (spots < 1) {
      return res.status(400).json({ success: false, message: 'Please select at least 1 ticket.' });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, email: true, phone: true },
        },
        bookings: {
          where: { status: { not: 'CANCELLED' } },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.price && event.price > 0) {
      return res.status(400).json({
        success: false,
        message: 'This is a ticketed event. Please proceed through payment checkout to reserve tickets.',
      });
    }

    const totalBooked = event.bookings.reduce((acc, b) => acc + (b.spots || 1), 0);
    const max = event.maxAttendees || 50;
    const available = Math.max(0, max - totalBooked);

    if (spots > available) {
      return res.status(400).json({
        success: false,
        message: available === 0 ? 'This event is completely sold out.' : `Only ${available} spots remaining for this event.`,
      });
    }

    const existing = await prisma.eventBooking.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });

    const finalSpots = (existing && existing.status !== 'CANCELLED')
      ? (existing.spots + spots)
      : spots;

    const booking = await prisma.eventBooking.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId,
        },
      },
      update: {
        status: 'CONFIRMED',
        spots: finalSpots,
        totalAmount: 0,
      },
      create: {
        eventId: id,
        userId,
        spots: finalSpots,
        totalAmount: 0,
        status: 'CONFIRMED',
      },
      include: {
        event: true,
        user: {
          select: { id: true, name: true, email: true, phone: true, city: true },
        },
      },
    });

    // Create EventRegistration in admin table
    const ticketCode = `TKT-${event.id.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "EventRegistration" ("id", "eventId", "userId", "ticketCode", "paymentStatus", "status", "createdAt")
        VALUES ($1, $2, $3, $4, 'FREE', 'CONFIRMED', CURRENT_TIMESTAMP)
        ON CONFLICT ("ticketCode") DO NOTHING;
      `, `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, id, userId, ticketCode);
    } catch (regErr) {}

    // --- SEND EMAILS TO BOTH ATTENDEE AND EVENT HOST ---
    try {
      let attendee = booking.user;
      if (!attendee || !attendee.email) {
        attendee = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, phone: true, city: true },
        });
      }

      const hostName = event.host?.name || 'Event Organizer';
      const hostEmail = event.host?.email;
      const fromHeader = `${hostName} via JabWeMeet`;

      const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // 1. Email to Attendee (User)
      if (attendee?.email) {
        const attendeeSubject = `🎉 Congrats! Your booking for "${event.title}" was successful!`;
        const attendeeHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700;">🎉 Congrats! Booking Successful!</h1>
              <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">You have successfully booked an event with us</p>
            </div>
            
            <div style="padding: 24px;">
              <p style="font-size: 16px; color: #333;">Hi <strong>${attendee.name || 'Friend'}</strong>,</p>
              <p style="font-size: 15px; color: #444; line-height: 1.6;">
                Congrats! Your booking was successful! You have booked <strong>${spots} ${spots === 1 ? 'ticket' : 'tickets'}</strong> for <strong>"${event.title}"</strong> hosted by <strong>${hostName}</strong>.
              </p>
              
              <div style="background-color: #f6fbf6; border-left: 4px solid #4CAF50; padding: 18px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #2E7D32; font-size: 18px;">📋 Event & Ticket Details</h3>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎉 Event:</strong> ${event.title}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>👤 Host:</strong> ${hostName}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📅 Date & Time:</strong> ${formattedDate}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📍 Venue:</strong> ${event.location}, ${event.city}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎟️ Tickets Booked:</strong> ${spots}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>💰 Amount Paid:</strong> Free Entry (₹0)</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎫 Ticket Code:</strong> <span style="font-family: monospace; background: #e8f5e9; padding: 3px 8px; border-radius: 4px; font-weight: bold; color: #1b5e20;">${ticketCode}</span></p>
              </div>

              <div style="background-color: #fcf8e3; border: 1px solid #faebcc; padding: 12px 16px; border-radius: 6px; margin: 15px 0; font-size: 13px; color: #8a6d3b;">
                💬 <em>"Thank you for booking with us! We can't wait to welcome you to the event."</em> — <strong>${hostName}</strong>
              </div>

              <p style="font-size: 14px; color: #666; line-height: 1.5;">
                Please keep this email and your Ticket Code handy for entry at the venue.
              </p>

              <div style="text-align: center; margin: 30px 0 15px 0;">
                <a href="http://localhost:3000/dashboard?tab=events" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 30px; display: inline-block; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
                  View My Bookings & Events 👉
                </a>
              </div>
            </div>

            <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
              Sent on behalf of <strong>${hostName}</strong> via <strong>JabWeMeet</strong> 💖
            </div>
          </div>
        `;

        try {
          await sendMail(attendee.email, attendeeSubject, '', attendeeHtml, fromHeader, hostEmail);
          console.log(`✅ [Booking Email] Successfully sent free ticket confirmation to attendee: ${attendee.email}`);
        } catch (err) {
          console.error(`⚠️ [Booking Email] Failed sending to attendee ${attendee.email}:`, err.message || err);
        }
      }

      // 2. Email to Host
      if (event.host?.email) {
        const hostSubject = `🔔 New Booking Alert: ${attendee.name} booked "${event.title}"`;
        const hostHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #e06d53 0%, #f7a072 100%); padding: 28px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700;">🎉 New Attendee Registered!</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">A user just booked free spots for your event</p>
            </div>
            
            <div style="padding: 24px;">
              <p style="font-size: 15px; color: #333;">Hi <strong>${hostName}</strong>,</p>
              <p style="font-size: 14px; color: #555; line-height: 1.6;">
                Great news! <strong>${attendee.name}</strong> has just booked ticket(s) for your upcoming event <strong>"${event.title}"</strong>.
              </p>
              
              <div style="background-color: #fdf6f0; border-left: 4px solid #e06d53; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #e06d53; font-size: 17px;">👤 Attendee Information</h3>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>👤 Name:</strong> ${attendee.name}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📧 Email:</strong> ${attendee.email}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📱 Phone:</strong> ${attendee.phone || 'N/A'}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>📍 City:</strong> ${attendee.city || 'N/A'}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎟️ Spots Booked:</strong> ${spots}</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>💰 Amount Paid:</strong> Free Entry (₹0)</p>
                <p style="margin: 6px 0; color: #444; font-size: 14px;"><strong>🎫 Ticket Code:</strong> <span style="font-family: monospace; background: #ffeae4; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${ticketCode}</span></p>
              </div>

              <div style="background-color: #fbfbfb; padding: 14px; border-radius: 6px; margin: 15px 0; font-size: 13px; color: #666;">
                <p style="margin: 4px 0;"><strong>Event:</strong> ${event.title}</p>
                <p style="margin: 4px 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 4px 0;"><strong>Venue:</strong> ${event.location}, ${event.city}</p>
              </div>

              <div style="text-align: center; margin: 30px 0 15px 0;">
                <a href="http://localhost:3000/host/dashboard" style="background-color: #e06d53; color: white; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 30px; display: inline-block;">
                  View Host Dashboard 👉
                </a>
              </div>
            </div>

            <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
              JabWeMeet Host Notification System 💖
            </div>
          </div>
        `;

        try {
          await sendMail(event.host.email, hostSubject, '', hostHtml);
          console.log(`✅ [Host Alert Email] Successfully sent booking alert to host: ${event.host.email}`);
        } catch (err) {
          console.error(`⚠️ [Host Alert Email] Failed sending to host ${event.host.email}:`, err.message || err);
        }
      }
    } catch (err) {
      console.error('❌ [Free Booking Email Error]:', err);
    }

    return res.status(201).json({
      success: true,
      message: `🎉 Spot reserved successfully for ${event.title}!`,
      booking,
    });
  } catch (error) {
    console.error('Error booking free event:', error);
    return res.status(500).json({ success: false, message: 'Failed to reserve spot.' });
  }
});

// POST /api/events/:id/cancel - Ticket cancellation policy (Attendee cancellations disallowed)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Tickets and reservations are final and cannot be cancelled by attendees.',
      });
    }

    const { id } = req.params;
    const userId = req.body.userId || req.user.userId || req.user.id;

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

    return res.json({ success: true, message: 'Reservation cancelled by administrator.', booking: updated });
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

// POST /api/events/:id/send-reminder - Host or Admin sends 24-hour reminder email to event attendees
router.post('/:id/send-reminder', authenticateToken, requireRole(['ADMIN', 'HOST', 'EVENT_MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId || req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const { userId } = req.body;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (!isAdmin && event.hostId !== hostId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to manage reminders for this event.' });
    }

    const result = await sendEvent24hReminder({
      eventId: id,
      targetUserId: userId || null,
      triggeredByHost: true,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error sending event reminder:', error);
    return res.status(500).json({ success: false, message: 'Failed to send event reminder emails.' });
  }
});

module.exports = router;
