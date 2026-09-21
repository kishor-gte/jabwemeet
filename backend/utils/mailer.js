const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  secure: process.env.MAIL_PORT == '465',
  auth: {
    user: process.env.MAIL_USERNAME || 'yogithamgowdayogitha@gmail.com',
    pass: process.env.MAIL_PASSWORD || 'bhzoxxwajawaqmps',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const FROM_HEADER = `"JabWeMeet Support" <${process.env.MAIL_USERNAME || 'yogithamgowdayogitha@gmail.com'}>`;
const DASHBOARD_URL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/breakup-buddy/dashboard`;

/**
 * Base email wrapper with JabWeMeet branding
 */
function wrapTemplate({ title, badge, contentHtml, buttonText, buttonUrl }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin:0; padding:0; background-color:#0b0f19; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#cbd5e1; }
      .container { max-width:600px; margin:30px auto; background:#131d2e; border:1px solid #1e293b; border-radius:20px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.5); }
      .header { background: linear-gradient(135deg, #1e1b4b, #0f172a); padding:30px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.08); }
      .brand { font-size:24px; font-weight:900; color:#ffffff; letter-spacing:-0.5px; }
      .brand span { color:#818cf8; }
      .badge { display:inline-block; margin-top:12px; padding:4px 14px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
      .badge-success { background:rgba(16,185,129,0.2); color:#34d399; border:1px solid rgba(16,185,129,0.3); }
      .badge-info { background:rgba(99,102,241,0.2); color:#a5b4fc; border:1px solid rgba(99,102,241,0.3); }
      .badge-warning { background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid rgba(245,158,11,0.3); }
      .badge-rose { background:rgba(244,63,94,0.2); color:#fda4af; border:1px solid rgba(244,63,94,0.3); }
      .content { padding:32px 30px; line-height:1.6; font-size:14px; color:#cbd5e1; }
      .card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:20px; margin:20px 0; }
      .cta-btn { display:inline-block; padding:14px 32px; background:linear-gradient(135deg, #6366f1, #4f46e5); color:#ffffff !important; text-decoration:none; font-weight:bold; font-size:14px; border-radius:12px; box-shadow:0 4px 15px rgba(79,70,229,0.4); margin:20px 0 10px 0; }
      .footer { background:#0a101d; padding:20px; text-align:center; font-size:11px; color:#64748b; border-top:1px solid rgba(255,255,255,0.05); }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="brand">JabWe<span>Meet</span></div>
        <div class="badge ${badge.type}">${badge.text}</div>
      </div>
      <div class="content">
        ${contentHtml}
        ${buttonText && buttonUrl ? `
          <div style="text-align:center; margin-top:25px;">
            <a href="${buttonUrl}" class="cta-btn">${buttonText}</a>
          </div>
        ` : ''}
      </div>
      <div class="footer">
        <p>This is an automated notification from JabWeMeet Breakup Buddy System.</p>
        <p>© ${new Date().getFullYear()} JabWeMeet. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * 1. Admin Approved Breakup Buddy Profile
 */
async function sendBuddyApprovedEmail({ buddyEmail, buddyName }) {
  if (!buddyEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Profile Approved - JabWeMeet Breakup Buddy',
      badge: { text: '🎉 Profile Approved', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Congratulations, ${buddyName}!</h2>
        <p>Your application as a <strong>Breakup Buddy</strong> has been reviewed and <strong style="color:#34d399;">APPROVED</strong> by our Admin team.</p>
        <div class="card">
          <p style="margin:0 0 10px 0; color:#e2e8f0;"><strong>What happens next?</strong></p>
          <ul style="margin:0; padding-left:20px; color:#94a3b8;">
            <li>Your profile is now live and visible to users seeking support.</li>
            <li>Users can request 1-on-1 chat or voice call sessions with you.</li>
            <li>Users can purchase hourly packages with you to earn income.</li>
          </ul>
        </div>
        <p>Log in to your dedicated Breakup Buddy dashboard to manage incoming requests, sessions, and track earnings.</p>
      `,
      buttonText: 'Go to Buddy Dashboard 🚀',
      buttonUrl: DASHBOARD_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: buddyEmail,
      subject: '🎉 Congratulations! Your Breakup Buddy Profile is Approved - JabWeMeet',
      html,
    });
    console.log(`[Mailer] Buddy Approved email sent to ${buddyEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Failed to send Buddy Approved email:`, err.message);
  }
}

/**
 * 2. Admin Rejected Breakup Buddy Profile
 */
async function sendBuddyRejectedEmail({ buddyEmail, buddyName, reason }) {
  if (!buddyEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Application Status - JabWeMeet Breakup Buddy',
      badge: { text: '⚠️ Application Update', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${buddyName},</h2>
        <p>Thank you for your interest in joining JabWeMeet as a Breakup Buddy.</p>
        <p>Our Admin team has reviewed your application and unfortunately we are unable to approve it at this time.</p>
        ${reason ? `
          <div class="card" style="border-left: 4px solid #f59e0b;">
            <p style="margin:0; color:#e2e8f0;"><strong>Feedback / Reason:</strong></p>
            <p style="margin:5px 0 0 0; color:#fbbf24;">${reason}</p>
          </div>
        ` : ''}
        <p>If you have questions or wish to update your documentation, please contact our support team.</p>
      `,
      buttonText: 'Contact Support',
      buttonUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/support`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: buddyEmail,
      subject: 'Update Regarding Your Breakup Buddy Application - JabWeMeet',
      html,
    });
    console.log(`[Mailer] Buddy Rejected email sent to ${buddyEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Failed to send Buddy Rejected email:`, err.message);
  }
}

/**
 * 3. New User Support Connection Request
 */
async function sendNewConnectionRequestEmail({ buddyEmail, buddyName, userName, topic, sessionFormat }) {
  if (!buddyEmail) return;
  try {
    const html = wrapTemplate({
      title: 'New Support Request - JabWeMeet',
      badge: { text: '💬 New Connection Request', type: 'badge-info' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hi ${buddyName},</h2>
        <p>A member has just requested a support session with you on JabWeMeet!</p>
        <div class="card">
          <div style="margin-bottom:10px;">
            <span style="color:#64748b; font-size:12px; display:block;">User:</span>
            <strong style="color:#ffffff; font-size:15px;">${userName}</strong>
          </div>
          <div style="margin-bottom:10px;">
            <span style="color:#64748b; font-size:12px; display:block;">Session Format:</span>
            <strong style="color:#818cf8;">${sessionFormat || 'Chat & Voice Call'}</strong>
          </div>
          <div>
            <span style="color:#64748b; font-size:12px; display:block;">Topic / Message:</span>
            <p style="margin:4px 0 0 0; color:#e2e8f0; font-style:italic;">"${topic || '1-on-1 Emotional Support Session'}"</p>
          </div>
        </div>
        <p>Please log in to your dashboard to review this request and begin the session.</p>
      `,
      buttonText: 'View Request in Dashboard 👉',
      buttonUrl: DASHBOARD_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: buddyEmail,
      subject: `💬 New Support Request from ${userName} - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] New connection request email sent to ${buddyEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Failed to send Connection Request email:`, err.message);
  }
}

/**
 * 4. Package Purchased / Unlimited Pass Earning Alert
 */
async function sendPassPurchasedEmail({ buddyEmail, buddyName, userName, packageName, durationHours, amountEarned }) {
  if (!buddyEmail) return;
  try {
    const html = wrapTemplate({
      title: 'New Pass Earning Alert - JabWeMeet',
      badge: { text: '💰 Package Earning Alert', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Great News, ${buddyName}! 🎉</h2>
        <p><strong style="color:#34d399;">${userName}</strong> has just purchased an Hourly Unlimited Pass with you!</p>
        <div class="card" style="background:linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.08)); border-color:rgba(16,185,129,0.3);">
          <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
            <span style="color:#94a3b8;">Package Name:</span>
            <strong style="color:#ffffff;">${packageName || `${durationHours}h Pass`}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
            <span style="color:#94a3b8;">Duration:</span>
            <strong style="color:#818cf8;">${durationHours} ${durationHours === 1 ? 'Hour' : 'Hours'} Unlimited</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:#94a3b8;">Amount Credited:</span>
            <strong style="color:#34d399; font-size:18px;">₹${amountEarned || 0}</strong>
          </div>
        </div>
        <p>The user has unlimited calls and chat enabled for the next <strong>${durationHours} ${durationHours === 1 ? 'hour' : 'hours'}</strong>. Make sure you are active to give them the best support!</p>
      `,
      buttonText: 'Open Buddy Chat & Calls 💬',
      buttonUrl: DASHBOARD_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: buddyEmail,
      subject: `💰 Earning Alert: ${userName} Bought a ${durationHours}h Pass (₹${amountEarned}) with You! - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Pass Purchased email sent to ${buddyEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Failed to send Pass Purchased email:`, err.message);
  }
}

/**
 * 5. New Review and Rating Received
 */
async function sendNewReviewEmail({ buddyEmail, buddyName, userName, rating, comment }) {
  if (!buddyEmail) return;
  try {
    const stars = '⭐'.repeat(Math.max(1, Math.min(5, Math.round(rating || 5))));
    const html = wrapTemplate({
      title: 'New Review Received - JabWeMeet',
      badge: { text: '⭐ New Review', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">You Received a New Review, ${buddyName}!</h2>
        <p>A client has submitted feedback for their recent session with you.</p>
        <div class="card">
          <div style="margin-bottom:10px;">
            <span style="color:#64748b; font-size:12px; display:block;">Client:</span>
            <strong style="color:#ffffff;">${userName || 'Anonymous Client'}</strong>
          </div>
          <div style="margin-bottom:10px;">
            <span style="color:#64748b; font-size:12px; display:block;">Rating:</span>
            <span style="font-size:16px;">${stars} (${rating || 5}/5)</span>
          </div>
          ${comment ? `
            <div>
              <span style="color:#64748b; font-size:12px; display:block;">Client Feedback:</span>
              <p style="margin:4px 0 0 0; color:#e2e8f0; font-style:italic;">"${comment}"</p>
            </div>
          ` : ''}
        </div>
        <p>Keep up the empathetic and compassionate support!</p>
      `,
      buttonText: 'View All Reviews in Dashboard ⭐',
      buttonUrl: `${DASHBOARD_URL}?tab=reviews`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: buddyEmail,
      subject: `⭐ New Review Received (${rating || 5} Stars) from ${userName} - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] New review email sent to ${buddyEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Failed to send New Review email:`, err.message);
  }
}

/**
 * 6. Missed Call Alert
 */
async function sendMissedCallEmail({ buddyEmail, buddyName, callerName }) {
  if (!buddyEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Missed Call Alert - JabWeMeet',
      badge: { text: '📞 Missed Call', type: 'badge-rose' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${buddyName},</h2>
        <p>You missed an incoming voice call from <strong style="color:#ffffff;">${callerName || 'a client'}</strong>.</p>
        <div class="card">
          <p style="margin:0; color:#e2e8f0;">
            Caller: <strong style="color:#ffffff;">${callerName}</strong><br>
            Time: <span style="color:#94a3b8;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
        <p>Please log in to your Breakup Buddy dashboard to check your messages and reconnect with your user.</p>
      `,
      buttonText: 'Open Buddy Dashboard 📞',
      buttonUrl: DASHBOARD_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: buddyEmail,
      subject: `📞 Missed Call Alert from ${callerName} - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Missed call email sent to ${buddyEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Failed to send Missed Call email:`, err.message);
  }
}

module.exports = {
  transporter,
  sendBuddyApprovedEmail,
  sendBuddyRejectedEmail,
  sendNewConnectionRequestEmail,
  sendPassPurchasedEmail,
  sendNewReviewEmail,
  sendMissedCallEmail,
};
