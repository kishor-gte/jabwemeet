const prisma = require('../db');
const { sendMail } = require('./emailService');

// In-memory cache to prevent duplicate automated 24-hour reminder emails
// Map of eventId -> timestamp of last sent reminder
const sentReminderTracker = new Map();

/**
 * Format event date in Indian standard human-readable format
 */
function formatEventDate(dateInput) {
  try {
    const d = new Date(dateInput);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Send 24-Hour Event Reminder Email to attendees
 * @param {Object} params
 * @param {string} params.eventId
 * @param {string} [params.targetUserId] - If provided, sends only to this specific user
 * @param {boolean} [params.triggeredByHost=false]
 */
async function sendEvent24hReminder({ eventId, targetUserId = null, triggeredByHost = false }) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            ...(targetUserId ? { userId: targetUserId } : {}),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return { success: false, message: 'Event not found', count: 0 };
    }

    if (!event.bookings || event.bookings.length === 0) {
      return {
        success: true,
        message: targetUserId
          ? 'No active booking found for this attendee.'
          : 'No active attendees registered for this event yet.',
        count: 0,
      };
    }

    const hostName = event.host?.name || 'Your Event Host';
    const hostEmail = event.host?.email;
    const hostPhone = event.host?.phone;
    const fromHeader = `${hostName} via JabWeMeet`;
    const formattedDate = formatEventDate(event.date);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    let sentCount = 0;
    const recipientNames = [];

    // Fetch ticket registrations for accurate ticket codes if available
    const registrations = await prisma.$queryRawUnsafe(`
      SELECT "userId", "ticketCode" FROM "EventRegistration" WHERE "eventId" = $1;
    `, event.id).catch(() => []);

    const ticketCodeMap = {};
    if (Array.isArray(registrations)) {
      registrations.forEach((r) => {
        if (r.userId && r.ticketCode) {
          ticketCodeMap[r.userId] = r.ticketCode;
        }
      });
    }

    for (const booking of event.bookings) {
      const attendee = booking.user;
      if (!attendee || !attendee.email || !attendee.email.includes('@')) {
        continue;
      }

      const ticketCode =
        ticketCodeMap[attendee.id] ||
        `TKT-${event.id.slice(-4).toUpperCase()}-${attendee.id.slice(-4).toUpperCase()}`;

      const emailSubject = `⏰ Reminder: Your Event "${event.title}" is Tomorrow! [Code: ${ticketCode}]`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Reminder - JabWeMeet</title>
        </head>
        <body style="margin:0; padding:0; background-color:#070b14; font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif; color:#cbd5e1; -webkit-font-smoothing:antialiased;">
          <div style="background-color:#070b14; padding:25px 10px;">
            <div style="max-width:600px; margin:0 auto; background:#111927; border:1px solid #1e293b; border-radius:24px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
              
              <!-- HEADER -->
              <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding:32px 24px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:26px; font-weight:900; color:#e06d53; letter-spacing:-0.5px;">
                  JabWe<span style="color:#ffffff;">Meet</span> ✨
                </div>
                <div style="display:inline-block; margin-top:14px; padding:6px 18px; border-radius:24px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; background:rgba(245,158,11,0.18); color:#fbbf24; border:1px solid rgba(245,158,11,0.4);">
                  ⏰ Tomorrow is Your Event!
                </div>
              </div>

              <!-- CONTENT -->
              <div style="padding:36px 28px; line-height:1.65; font-size:14px; color:#cbd5e1;">
                <h2 style="color:#ffffff; margin:0 0 10px 0; font-size:22px; font-weight:800;">
                  Get Ready, ${attendee.name || 'Friend'}! 🎉
                </h2>
                <p style="margin:0 0 20px 0; color:#94a3b8; font-size:14px;">
                  This is your 24-hour reminder that your upcoming event <strong style="color:#e06d53;">"${event.title}"</strong> hosted by <strong style="color:#ffffff;">${hostName}</strong> takes place <strong>TOMORROW</strong>!
                </p>

                <!-- EVENT CARD -->
                <div style="background:linear-gradient(135deg, #162238 0%, #1e1b4b 100%); border:1px solid rgba(224,109,83,0.3); border-radius:18px; padding:22px; margin:22px 0;">
                  <h3 style="margin:0 0 14px 0; color:#ffffff; font-size:17px; font-weight:700;">
                    📋 Event Schedule & Venue Information
                  </h3>
                  
                  <div style="margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
                    <span style="color:#94a3b8; font-size:12px; display:block;">🎉 Event Name:</span>
                    <strong style="color:#ffffff; font-size:15px;">${event.title}</strong>
                  </div>

                  <div style="margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
                    <span style="color:#94a3b8; font-size:12px; display:block;">👤 Event Host:</span>
                    <strong style="color:#fbbf24; font-size:14px;">${hostName}</strong>
                  </div>

                  <div style="margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
                    <span style="color:#94a3b8; font-size:12px; display:block;">📅 Date & Time:</span>
                    <strong style="color:#38bdf8; font-size:14px;">📅 ${formattedDate}</strong>
                  </div>

                  <div style="margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
                    <span style="color:#94a3b8; font-size:12px; display:block;">📍 Location / Venue:</span>
                    <span style="color:#e2e8f0; font-size:14px; font-weight:600;">${event.location}, ${event.city}</span>
                  </div>

                  <div style="margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
                    <span style="color:#94a3b8; font-size:12px; display:block;">🎟️ Passes Reserved:</span>
                    <span style="color:#34d399; font-size:14px; font-weight:700;">${booking.spots || 1} ${(booking.spots || 1) === 1 ? 'Spot' : 'Spots'} (${event.price > 0 ? `₹${booking.totalAmount || event.price}` : 'Free Entry'})</span>
                  </div>

                  <div style="background:#0b1120; border-radius:12px; padding:14px 18px; margin-top:14px; text-align:center;">
                    <div style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Official Ticket Pass Code</div>
                    <div style="font-family:monospace; font-size:22px; font-weight:900; color:#34d399; letter-spacing:3px;">
                      ${ticketCode}
                    </div>
                  </div>
                </div>

                <!-- TIPS / CHECKLIST -->
                <div style="background:#0f172a; border:1px solid rgba(245,158,11,0.25); border-radius:16px; padding:18px; margin:20px 0;">
                  <p style="margin:0 0 10px 0; color:#fbbf24; font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">
                    💡 Tips & Check-in Checklist:
                  </p>
                  <ul style="margin:0; padding-left:20px; color:#cbd5e1; font-size:13px; line-height:1.7;">
                    <li><strong>Arrive 15 minutes early:</strong> Gives you time for check-in and settling in comfortably.</li>
                    <li><strong>Entry Verification:</strong> Show this email or your digital ticket pass code at the entrance desk.</li>
                    <li><strong>Dress Code:</strong> Smart casual is recommended.</li>
                    <li><strong>Bring Your Energy:</strong> Get ready to have fun, make new friends, and share great moments!</li>
                  </ul>
                </div>

                <!-- HOST PERSONAL NOTE -->
                <div style="background:rgba(224,109,83,0.1); border-left:4px solid #e06d53; border-radius:12px; padding:16px; margin:22px 0;">
                  <p style="margin:0; color:#fca5a5; font-size:13px; font-style:italic; line-height:1.6;">
                    "Hi ${attendee.name}! I am looking forward to hosting you tomorrow at ${event.title}. We have a wonderful session prepared for everyone. See you tomorrow!"
                  </p>
                  <p style="margin:8px 0 0 0; color:#ffffff; font-size:13px; font-weight:700;">
                    — ${hostName} (Event Host)
                  </p>
                  ${hostPhone ? `
                    <p style="margin:4px 0 0 0; color:#94a3b8; font-size:12px;">
                      📞 Host Contact: <a href="tel:${hostPhone}" style="color:#38bdf8; text-decoration:none;">${hostPhone}</a>
                    </p>
                  ` : ''}
                </div>

                <!-- ACTION BUTTON -->
                <div style="text-align:center; margin:32px 0 10px 0;">
                  <a href="${frontendUrl}/dashboard?tab=events" style="display:inline-block; padding:14px 34px; background:linear-gradient(135deg, #e06d53, #b8432a); color:#ffffff !important; text-decoration:none; font-weight:800; font-size:14px; border-radius:14px; box-shadow:0 8px 25px rgba(224,109,83,0.35);">
                    View My Ticket Pass & Details 🎟️
                  </a>
                </div>
              </div>

              <!-- FOOTER -->
              <div style="background:#0a101d; padding:24px 20px; text-align:center; font-size:12px; color:#64748b; border-top:1px solid rgba(255,255,255,0.05);">
                <p style="margin:0 0 6px 0;">Sent on behalf of <strong>${hostName}</strong> via <strong>JabWeMeet</strong>.</p>
                <p style="margin:0; font-size:11px; color:#475569;">Real People • Real Places • Real Connections</p>
              </div>

            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await sendMail(attendee.email, emailSubject, '', emailHtml, fromHeader, hostEmail);
        sentCount++;
        recipientNames.push(attendee.name || attendee.email);
        console.log(`✅ [24h Event Reminder] Sent to ${attendee.email} for "${event.title}"`);
      } catch (mailErr) {
        console.error(`⚠️ [24h Event Reminder] Failed sending to ${attendee.email}:`, mailErr.message || mailErr);
      }
    }

    if (sentCount > 0) {
      sentReminderTracker.set(event.id, Date.now());
    }

    return {
      success: true,
      count: sentCount,
      attendees: recipientNames,
      message: `🎉 Successfully sent reminder emails to ${sentCount} attendee(s) for "${event.title}".`,
    };
  } catch (error) {
    console.error('❌ [Event Reminder Service Error]:', error);
    return {
      success: false,
      message: error.message || 'Failed to send event reminder emails.',
      count: 0,
    };
  }
}

/**
 * Automatically scan for upcoming events occurring in the next 24 hours
 * and send reminder emails to all confirmed attendees.
 */
async function checkAndSendAutomated24hReminders() {
  try {
    const now = new Date();
    // 24 hours window: Events occurring between (now + 1 hour) and (now + 26 hours)
    const windowStart = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        date: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        host: {
          select: { id: true, name: true, email: true, phone: true },
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          },
          select: { id: true },
        },
      },
    });

    if (!upcomingEvents || upcomingEvents.length === 0) {
      return;
    }

    console.log(`⏰ [Automated 24h Reminder] Found ${upcomingEvents.length} upcoming event(s) in next 24h window.`);

    for (const event of upcomingEvents) {
      if (!event.bookings || event.bookings.length === 0) continue;

      const lastSent = sentReminderTracker.get(event.id);
      // If reminder was sent in the last 18 hours for this event, skip duplicate
      if (lastSent && Date.now() - lastSent < 18 * 60 * 60 * 1000) {
        continue;
      }

      console.log(`📬 [Automated 24h Reminder] Dispatching reminders for event: "${event.title}" (${event.bookings.length} attendees)`);
      await sendEvent24hReminder({ eventId: event.id, triggeredByHost: false });
    }
  } catch (err) {
    console.error('⚠️ [Automated 24h Reminder Error]:', err.message || err);
  }
}

/**
 * Start the recurring background reminder scheduler
 */
function startEventReminderCron() {
  // Run 15 seconds after server boot
  setTimeout(() => {
    checkAndSendAutomated24hReminders();
  }, 15000);

  // Run every 30 minutes thereafter
  setInterval(() => {
    checkAndSendAutomated24hReminders();
  }, 30 * 60 * 1000);

  console.log('⏰ [JabWeMeet] Event 24-Hour Reminder Cron initialized (Every 30 mins).');
}

module.exports = {
  sendEvent24hReminder,
  checkAndSendAutomated24hReminders,
  startEventReminderCron,
  sentReminderTracker,
};
