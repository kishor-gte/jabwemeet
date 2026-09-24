let transporter;

try {
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
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
} catch (err) {
  console.warn('⚠️ [JabWeMeet Mailer] "nodemailer" not installed or failed to load. Outgoing emails will be logged instead of failing.');
  transporter = {
    sendMail: async (options) => {
      console.log(`[JabWeMeet Mailer Sim] To: ${options.to} | Subject: ${options.subject}`);
      return { messageId: 'simulated-' + Date.now() };
    },
  };
}

const FROM_HEADER = `"JabWeMeet Official" <${process.env.MAIL_USERNAME || 'yogithamgowdayogitha@gmail.com'}>`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const DASHBOARD_URL = `${FRONTEND_URL}/breakup-buddy/dashboard`;
const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || process.env.MAIL_USERNAME || 'yogithamgowdayogitha@gmail.com';

/**
 * Base email wrapper with JabWeMeet luxury dark branding
 */
function wrapTemplate({ title, badge, contentHtml, buttonText, buttonUrl }) {
  const badgeClasses = {
    'badge-success': 'background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.35);',
    'badge-info': 'background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.35);',
    'badge-warning': 'background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.35);',
    'badge-rose': 'background:rgba(244,63,94,0.15); color:#fda4af; border:1px solid rgba(244,63,94,0.35);',
    'badge-purple': 'background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.35);',
  };
  const badgeStyle = badgeClasses[badge?.type] || badgeClasses['badge-info'];

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body { margin:0; padding:0; background-color:#070b14; font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif; color:#cbd5e1; -webkit-font-smoothing:antialiased; }
      table { border-collapse:collapse; }
      .container { max-width:600px; margin:30px auto; background:#111927; border:1px solid #1e293b; border-radius:24px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.6); }
      .header { background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding:32px 24px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.08); }
      .brand { font-size:26px; font-weight:900; color:#e06d53; letter-spacing:-0.5px; text-decoration:none; }
      .brand span { color:#e06d53; }
      .badge-pill { display:inline-block; margin-top:14px; padding:6px 16px; border-radius:24px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; ${badgeStyle} }
      .content { padding:36px 32px; line-height:1.65; font-size:14px; color:#cbd5e1; }
      .card { background:#162238; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:22px; margin:22px 0; }
      .highlight-row { display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px; font-size:13px; }
      .highlight-label { color:#94a3b8; }
      .highlight-val { color:#ffffff; font-weight:600; }
      .cta-btn { display:inline-block; padding:15px 36px; background:linear-gradient(135deg, #ec4899, #8b5cf6); color:#ffffff !important; text-decoration:none; font-weight:700; font-size:14px; border-radius:14px; box-shadow:0 8px 25px rgba(236,72,153,0.35); margin:20px 0 10px 0; }
      .footer { background:#0a101d; padding:24px 20px; text-align:center; font-size:12px; color:#64748b; border-top:1px solid rgba(255,255,255,0.05); }
      .footer a { color:#818cf8; text-decoration:none; }
    </style>
  </head>
  <body>
    <div style="background-color:#070b14; padding:20px 10px;">
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="brand">JabWe<span>Meet</span> ✨</div>
          ${badge ? `<div class="badge-pill">${badge.text}</div>` : ''}
        </div>

        <!-- BODY -->
        <div class="content">
          ${contentHtml}
          ${buttonText && buttonUrl ? `
            <div style="text-align:center; margin-top:28px;">
              <a href="${buttonUrl}" class="cta-btn">${buttonText}</a>
            </div>
          ` : ''}
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} <strong>JabWeMeet Technologies</strong>. All rights reserved.</p>
          <p style="margin:0; font-size:11px; color:#475569;">Real People • Real Places • Real Connections</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

// ==========================================
// 1. USER VERIFICATION & STATUS
// ==========================================

/** User Verification Approved */
async function sendUserVerificationApprovedEmail({ userEmail, userName }) {
  if (!userEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Identity Verified - JabWeMeet',
      badge: { text: '⭐ Profile Verified', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Congratulations, ${userName || 'Member'}! 🎉</h2>
        <p>Your identity documents have been reviewed and <strong style="color:#34d399;">APPROVED</strong> by our trust and safety team.</p>
        <div class="card">
          <p style="margin:0 0 10px 0; color:#e2e8f0; font-weight:700;">🌟 Your Verified Benefits are now active:</p>
          <ul style="margin:0; padding-left:20px; color:#94a3b8; line-height:1.7;">
            <li><strong style="color:#ffffff;">Verified Badge:</strong> Blue checkmark displayed on your profile.</li>
            <li><strong style="color:#ffffff;">Priority Matching:</strong> Top recommendation in matchmaking feeds.</li>
            <li><strong style="color:#ffffff;">VIP Access:</strong> RSVP directly for offline curated events and mixers.</li>
          </ul>
        </div>
        <p>Explore verified connections and upcoming mixers in your city today!</p>
      `,
      buttonText: 'Explore Events & Matches 💫',
      buttonUrl: `${FRONTEND_URL}/dashboard`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: '⭐ Congratulations! Your JabWeMeet Profile is Officially Verified',
      html,
    });
    console.log(`[Mailer] User Verified Approved email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] User Verified Approved:`, err.message);
  }
}

/** User Verification Rejected */
async function sendUserVerificationRejectedEmail({ userEmail, userName, reason }) {
  if (!userEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Verification Update - JabWeMeet',
      badge: { text: '⚠️ Verification Update', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${userName || 'Member'},</h2>
        <p>Thank you for submitting your verification details to JabWeMeet.</p>
        <p>During review, our moderation team was unable to verify your submitted documents.</p>
        ${reason ? `
          <div class="card" style="border-left:4px solid #f59e0b;">
            <p style="margin:0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Reason / Feedback:</p>
            <p style="margin:6px 0 0 0; color:#fbbf24; font-size:14px; font-weight:600;">"${reason}"</p>
          </div>
        ` : ''}
        <p>Please log in and re-upload a clear government-issued ID proof or selfie photo to complete your verification.</p>
      `,
      buttonText: 'Re-upload Documents 📄',
      buttonUrl: `${FRONTEND_URL}/dashboard?tab=profile`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: '⚠️ Action Needed: Update on Your JabWeMeet Profile Verification',
      html,
    });
    console.log(`[Mailer] User Verified Rejected email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] User Verified Rejected:`, err.message);
  }
}

/** Account Status Notification (Active, Suspended, Blocked) */
async function sendUserStatusUpdatedEmail({ userEmail, userName, status, reason }) {
  if (!userEmail) return;
  try {
    const isSuspended = status === 'SUSPENDED' || status === 'BLOCKED';
    const html = wrapTemplate({
      title: `Account Status Update - JabWeMeet`,
      badge: {
        text: isSuspended ? '🚫 Account Restricted' : '✅ Account Active',
        type: isSuspended ? 'badge-rose' : 'badge-success',
      },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${userName || 'Member'},</h2>
        <p>Your JabWeMeet account status has been updated to: <strong style="color:${isSuspended ? '#fda4af' : '#34d399'}; font-size:16px;">${status}</strong>.</p>
        ${reason ? `
          <div class="card" style="border-left:4px solid ${isSuspended ? '#f43f5e' : '#10b981'};">
            <p style="margin:0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Administrative Note:</p>
            <p style="margin:6px 0 0 0; color:#ffffff; font-size:14px;">"${reason}"</p>
          </div>
        ` : ''}
        ${isSuspended ? `
          <p>If you believe this action was taken in error or would like to submit an appeal, please reach out to our trust and safety desk.</p>
        ` : `
          <p>You have full access to browse upcoming mixers, connect with buddies, and message verified matches.</p>
        `}
      `,
      buttonText: isSuspended ? 'Contact Support Helpdesk 📩' : 'Go to My Dashboard 🚀',
      buttonUrl: isSuspended ? `${FRONTEND_URL}/support` : `${FRONTEND_URL}/dashboard`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: `${isSuspended ? '⚠️ Important Notice:' : '✅ Status Update:'} Your JabWeMeet Account (${status})`,
      html,
    });
    console.log(`[Mailer] User Status email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] User Status:`, err.message);
  }
}

// ==========================================
// 2. PARTNER & SERVICE PROVIDER APPROVALS
// ==========================================

/** Relationship Manager Approved */
async function sendRMApprovedEmail({ email, name }) {
  if (!email) return;
  try {
    const html = wrapTemplate({
      title: 'Matchmaker Approved - JabWeMeet',
      badge: { text: '💍 Matchmaker Partner Approved', type: 'badge-purple' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Welcome to the Team, ${name}! 🎉</h2>
        <p>Your application as a certified <strong>Relationship Manager & Matchmaker</strong> has been <strong style="color:#c084fc;">APPROVED</strong> by the platform administrators.</p>
        <div class="card">
          <p style="margin:0 0 10px 0; color:#e2e8f0; font-weight:700;">💼 Matchmaker Control Center Features:</p>
          <ul style="margin:0; padding-left:20px; color:#94a3b8; line-height:1.7;">
            <li>View and accept assigned matchmaking clients.</li>
            <li>Curate bespoke match suggestions and schedule blind dates.</li>
            <li>Earn 90% revenue share on client matchmaking packages.</li>
          </ul>
        </div>
        <p>Log in to your Matchmaker portal to begin setting up your schedule and onboarding clients.</p>
      `,
      buttonText: 'Open Matchmaker Portal 🚀',
      buttonUrl: `${FRONTEND_URL}/matchmaker/dashboard`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: email,
      subject: '🎉 Congratulations! Your Relationship Manager Profile is Approved - JabWeMeet',
      html,
    });
    console.log(`[Mailer] RM Approved email sent to ${email}`);
  } catch (err) {
    console.error(`[Mailer Error] RM Approved:`, err.message);
  }
}

/** Relationship Manager Rejected / Unapproved */
async function sendRMRejectedEmail({ email, userEmail, name, userName, reason }) {
  const recipient = email || userEmail;
  if (!recipient) return;
  try {
    const displayName = name || userName || 'Relationship Manager';
    const html = wrapTemplate({
      title: 'Application Status - JabWeMeet',
      badge: { text: '⚠️ Account Update', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Account Status Notice ⚠️</h2>
        <p>Hello <strong style="color:#ffffff;">${displayName}</strong>,</p>
        <p>Your <strong>Relationship Manager & Matchmaker</strong> account privileges on JabWeMeet are currently not active.</p>
        ${reason ? `
          <div class="card" style="border-left:4px solid #f59e0b;">
            <p style="margin:0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Admin Note / Reason:</p>
            <p style="margin:6px 0 0 0; color:#fbbf24; font-size:14px; font-weight:600;">"${reason}"</p>
          </div>
        ` : ''}
        <div class="card" style="background:linear-gradient(135deg, #182238, #1e1b4b); border:1px solid rgba(168,85,247,0.35);">
          <p style="margin:0 0 6px 0; color:#ffffff; font-weight:700; font-size:14px;">💬 Want to move further or resolve this?</p>
          <p style="margin:0 0 12px 0; color:#cbd5e1; font-size:13px; line-height:1.6;">
            If you want to move further, re-activate your account, or discuss your credentials, please contact the Admin directly:
          </p>
          <div style="background:#0b1120; border-radius:12px; padding:12px 16px; display:inline-block;">
            <span style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px;">Admin Contact Email:</span>
            <a href="mailto:${ADMIN_EMAIL}" style="color:#38bdf8; font-size:15px; font-weight:700; text-decoration:none;">✉️ ${ADMIN_EMAIL}</a>
          </div>
        </div>
        <p style="font-size:13px; color:#94a3b8; margin-top:20px;">
          Please include your registered name and account details in all correspondence with the Admin.
        </p>
      `,
      buttonText: 'Email Admin Directly ✉️',
      buttonUrl: `mailto:${ADMIN_EMAIL}?subject=Relationship%20Manager%20Account%20Inquiry%20-${encodeURIComponent(displayName)}`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: '⚠️ Notice: Relationship Manager Account Update - Contact Admin - JabWeMeet',
      html,
    });
    console.log(`[Mailer] RM Rejected/Update email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] RM Rejected/Update:`, err.message);
  }
}

/** Relationship Manager Approval Revoked / Suspended */
async function sendRMRevokedEmail({ email, userEmail, name, userName, reason }) {
  const recipient = email || userEmail;
  if (!recipient) return;
  try {
    const displayName = name || userName || 'Relationship Manager';
    const html = wrapTemplate({
      title: 'Account Revoked - JabWeMeet',
      badge: { text: '⚠️ Account Revoked', type: 'badge-rose' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Your Account Privileges Have Been Revoked ⚠️</h2>
        <p>Hello <strong style="color:#ffffff;">${displayName}</strong>,</p>
        <p>Your <strong>Relationship Manager & Matchmaker</strong> account privileges on JabWeMeet have been <strong style="color:#fda4af;">REVOKED</strong> by the Admin.</p>
        
        <div class="card" style="border-left:4px solid #f43f5e; background:rgba(244,63,94,0.08);">
          <p style="margin:0 0 6px 0; color:#ffffff; font-weight:700;">🚫 Account Status Notice:</p>
          <p style="margin:0; color:#e2e8f0; font-size:14px; line-height:1.6;">
            Your Relationship Manager access has been revoked. You are currently not authorized to manage matchmaking clients or schedule date introductions.
          </p>
        </div>

        ${reason ? `
          <div class="card" style="border-left:4px solid #f59e0b;">
            <p style="margin:0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Reason / Note from Admin:</p>
            <p style="margin:6px 0 0 0; color:#fbbf24; font-size:14px; font-weight:600;">"${reason}"</p>
          </div>
        ` : ''}

        <div class="card" style="background:linear-gradient(135deg, #182238, #1e1b4b); border:1px solid rgba(168,85,247,0.35);">
          <p style="margin:0 0 6px 0; color:#ffffff; font-weight:700; font-size:14px;">💬 Want to move further or resolve this?</p>
          <p style="margin:0 0 12px 0; color:#cbd5e1; font-size:13px; line-height:1.6;">
            If you want to move further, re-verify your credentials, or resolve this with the administration, please contact the Admin directly:
          </p>
          <div style="background:#0b1120; border-radius:12px; padding:12px 16px; display:inline-block;">
            <span style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px;">Admin Contact Email:</span>
            <a href="mailto:${ADMIN_EMAIL}" style="color:#38bdf8; font-size:15px; font-weight:700; text-decoration:none;">✉️ ${ADMIN_EMAIL}</a>
          </div>
        </div>

        <p style="font-size:13px; color:#94a3b8; margin-top:20px;">
          Please include your registered name and account details in all correspondence with the Admin.
        </p>
      `,
      buttonText: 'Email Admin Directly ✉️',
      buttonUrl: `mailto:${ADMIN_EMAIL}?subject=Relationship%20Manager%20Account%20Revocation%20Inquiry%20-${encodeURIComponent(displayName)}`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: '⚠️ Notice: Your Relationship Manager Account Has Been Revoked - Contact Admin - JabWeMeet',
      html,
    });
    console.log(`[Mailer] RM Revoked email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] RM Revoked:`, err.message);
  }
}

/** Event Host / Manager Approved */
async function sendHostApprovedEmail({ email, userEmail, hostEmail, name, userName, hostName }) {
  const recipient = email || userEmail || hostEmail;
  if (!recipient) return;
  try {
    const displayName = name || userName || hostName || 'Host';
    const html = wrapTemplate({
      title: 'Host Account Approved - JabWeMeet',
      badge: { text: '🎪 Host Account Live', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Welcome aboard, ${displayName}! 🎟️</h2>
        <p>Your application as an <strong>Event Host / Manager</strong> is officially <strong style="color:#34d399;">APPROVED</strong>!</p>
        <div class="card">
          <p style="margin:0 0 10px 0; color:#e2e8f0; font-weight:700;">🎯 What you can do now:</p>
          <ul style="margin:0; padding-left:20px; color:#94a3b8; line-height:1.7;">
            <li>Create and publish singles mixers, speed-dating nights, and dinners.</li>
            <li>Scan and check-in attendee ticket QR codes in real-time.</li>
            <li>Receive automated revenue payouts directly to your bank account.</li>
          </ul>
        </div>
        <p>Start creating your first high-impact singles mixer today!</p>
      `,
      buttonText: 'Access Host Portal 🎪',
      buttonUrl: `${FRONTEND_URL}/host/events`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: '🎟️ Congratulations! Your Event Host Account is Approved - JabWeMeet',
      html,
    });
    console.log(`[Mailer] Host Approved email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] Host Approved:`, err.message);
  }
}

/** Event Host / Manager Rejected */
async function sendHostRejectedEmail({ email, userEmail, hostEmail, name, userName, hostName, reason }) {
  const recipient = email || userEmail || hostEmail;
  if (!recipient) return;
  try {
    const displayName = name || userName || hostName || 'Applicant';
    const html = wrapTemplate({
      title: 'Host Application Update - JabWeMeet',
      badge: { text: '🎫 Application Status', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${displayName},</h2>
        <p>Thank you for applying to become an Event Host on JabWeMeet.</p>
        <p>Our events verification team has reviewed your application and cannot approve host privileges at this time.</p>
        ${reason ? `
          <div class="card" style="border-left:4px solid #f59e0b;">
            <p style="margin:0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Feedback:</p>
            <p style="margin:6px 0 0 0; color:#fbbf24; font-size:14px;">"${reason}"</p>
          </div>
        ` : ''}
        <p>For inquiries regarding host requirements, feel free to contact our events coordination team.</p>
      `,
      buttonText: 'Support Helpdesk 📩',
      buttonUrl: `${FRONTEND_URL}/support`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: 'Update Regarding Your Event Host Application - JabWeMeet',
      html,
    });
    console.log(`[Mailer] Host Rejected email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] Host Rejected:`, err.message);
  }
}

/** Event Host Privileges Revoked / Suspended */
async function sendHostRevokedEmail({ email, userEmail, hostEmail, name, userName, hostName, reason }) {
  const recipient = email || userEmail || hostEmail;
  if (!recipient) return;
  try {
    const displayName = name || userName || hostName || 'Host';
    const html = wrapTemplate({
      title: 'Host Account Revoked - JabWeMeet',
      badge: { text: '⚠️ Account Revoked', type: 'badge-rose' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Your Host Privileges Have Been Revoked ⚠️</h2>
        <p>Hello <strong style="color:#ffffff;">${displayName}</strong>,</p>
        <p>Your <strong>Event Host / Manager</strong> privileges on JabWeMeet have been <strong style="color:#fda4af;">REVOKED</strong> by the Admin.</p>
        
        <div class="card" style="border-left:4px solid #f43f5e; background:rgba(244,63,94,0.08);">
          <p style="margin:0 0 6px 0; color:#ffffff; font-weight:700;">🚫 Account Status Notice:</p>
          <p style="margin:0; color:#e2e8f0; font-size:14px; line-height:1.6;">
            Your Host publishing access has been revoked. Ability to create or publish new singles events has been paused.
          </p>
        </div>

        ${reason ? `
          <div class="card" style="border-left:4px solid #f59e0b;">
            <p style="margin:0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Reason / Note from Admin:</p>
            <p style="margin:6px 0 0 0; color:#fbbf24; font-size:14px; font-weight:600;">"${reason}"</p>
          </div>
        ` : ''}

        <div class="card" style="background:linear-gradient(135deg, #182238, #1e1b4b); border:1px solid rgba(168,85,247,0.35);">
          <p style="margin:0 0 6px 0; color:#ffffff; font-weight:700; font-size:14px;">💬 Want to move further or resolve this?</p>
          <p style="margin:0 0 12px 0; color:#cbd5e1; font-size:13px; line-height:1.6;">
            If you want to move further, re-activate your host status, or resolve this with administration, please contact the Admin directly:
          </p>
          <div style="background:#0b1120; border-radius:12px; padding:12px 16px; display:inline-block;">
            <span style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px;">Admin Contact Email:</span>
            <a href="mailto:${ADMIN_EMAIL}" style="color:#38bdf8; font-size:15px; font-weight:700; text-decoration:none;">✉️ ${ADMIN_EMAIL}</a>
          </div>
        </div>

        <p style="font-size:13px; color:#94a3b8; margin-top:20px;">
          Please include your registered host details in your message.
        </p>
      `,
      buttonText: 'Email Admin Directly ✉️',
      buttonUrl: `mailto:${ADMIN_EMAIL}?subject=Host%20Account%20Revocation%20Inquiry%20-${encodeURIComponent(displayName)}`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: '⚠️ Notice: Your Event Host Privileges Have Been Revoked - Contact Admin - JabWeMeet',
      html,
    });
    console.log(`[Mailer] Host Revoked email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] Host Revoked:`, err.message);
  }
}

/** Breakup Buddy Approved */
async function sendBuddyApprovedEmail({ buddyEmail, email, userEmail, buddyName, name, userName }) {
  const recipient = buddyEmail || email || userEmail;
  if (!recipient) return;
  try {
    const displayName = buddyName || name || userName || 'Buddy';
    const html = wrapTemplate({
      title: 'Profile Approved - JabWeMeet Breakup Buddy',
      badge: { text: '🎉 Profile Approved', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Congratulations, ${displayName}! 💖</h2>
        <p>Your application as a <strong>Breakup Buddy</strong> has been reviewed and <strong style="color:#34d399;">APPROVED</strong> by our Admin team.</p>
        <div class="card">
          <p style="margin:0 0 10px 0; color:#e2e8f0; font-weight:700;">🌟 What happens next?</p>
          <ul style="margin:0; padding-left:20px; color:#94a3b8; line-height:1.7;">
            <li>Your profile is live and visible to members seeking empathetic support.</li>
            <li>Users can request 1-on-1 audio calls and live chat sessions with you.</li>
            <li>Earn 95% revenue for every hourly package and session completed.</li>
          </ul>
        </div>
        <p>Log in to your dedicated Breakup Buddy dashboard to manage incoming requests, sessions, and track earnings.</p>
      `,
      buttonText: 'Go to Buddy Dashboard 🚀',
      buttonUrl: DASHBOARD_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: '🎉 Congratulations! Your Breakup Buddy Profile is Approved - JabWeMeet',
      html,
    });
    console.log(`[Mailer] Buddy Approved email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] Buddy Approved:`, err.message);
  }
}

/** Breakup Buddy Rejected */
async function sendBuddyRejectedEmail({ buddyEmail, email, userEmail, buddyName, name, userName, reason }) {
  const recipient = buddyEmail || email || userEmail;
  if (!recipient) return;
  try {
    const displayName = buddyName || name || userName || 'Applicant';
    const html = wrapTemplate({
      title: 'Application Status - JabWeMeet Breakup Buddy',
      badge: { text: '⚠️ Application Update', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${displayName},</h2>
        <p>Thank you for your interest in joining JabWeMeet as a Breakup Buddy.</p>
        <p>Our Admin team has reviewed your application and unfortunately we are unable to approve it at this time.</p>
        ${reason ? `
          <div class="card" style="border-left:4px solid #f59e0b;">
            <p style="margin:0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Feedback / Reason:</p>
            <p style="margin:6px 0 0 0; color:#fbbf24; font-size:14px;">"${reason}"</p>
          </div>
        ` : ''}
        <p>If you have questions or wish to update your documentation, please contact our support team.</p>
      `,
      buttonText: 'Contact Support 📩',
      buttonUrl: `${FRONTEND_URL}/support`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: 'Update Regarding Your Breakup Buddy Application - JabWeMeet',
      html,
    });
    console.log(`[Mailer] Buddy Rejected email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] Buddy Rejected:`, err.message);
  }
}

/** Breakup Buddy Profile Revoked / Suspended */
async function sendBuddyRevokedEmail({ buddyEmail, email, userEmail, buddyName, name, userName, reason }) {
  const recipient = buddyEmail || email || userEmail;
  if (!recipient) return;
  try {
    const displayName = buddyName || name || userName || 'Buddy';
    const html = wrapTemplate({
      title: 'Profile Status Revoked - JabWeMeet Breakup Buddy',
      badge: { text: '⚠️ Profile Revoked', type: 'badge-rose' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Your Breakup Buddy Profile Has Been Revoked ⚠️</h2>
        <p>Hello <strong style="color:#ffffff;">${displayName}</strong>,</p>
        <p>Your <strong>Breakup Buddy</strong> profile status on JabWeMeet has been <strong style="color:#fda4af;">REVOKED</strong> by the Admin.</p>
        
        <div class="card" style="border-left:4px solid #f43f5e; background:rgba(244,63,94,0.08);">
          <p style="margin:0 0 6px 0; color:#ffffff; font-weight:700;">🚫 Account Status Notice:</p>
          <p style="margin:0; color:#e2e8f0; font-size:14px; line-height:1.6;">
            Your Breakup Buddy profile has been removed from the public directory, and new session requests have been paused.
          </p>
        </div>

        ${reason ? `
          <div class="card" style="border-left:4px solid #f59e0b;">
            <p style="margin:0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Reason / Note from Admin:</p>
            <p style="margin:6px 0 0 0; color:#fbbf24; font-size:14px; font-weight:600;">"${reason}"</p>
          </div>
        ` : ''}

        <div class="card" style="background:linear-gradient(135deg, #182238, #1e1b4b); border:1px solid rgba(168,85,247,0.35);">
          <p style="margin:0 0 6px 0; color:#ffffff; font-weight:700; font-size:14px;">💬 Want to move further or resolve this?</p>
          <p style="margin:0 0 12px 0; color:#cbd5e1; font-size:13px; line-height:1.6;">
            If you want to move further, re-activate your profile, or discuss this with the administration, please reach out directly to the Admin:
          </p>
          <div style="background:#0b1120; border-radius:12px; padding:12px 16px; display:inline-block;">
            <span style="color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px;">Admin Contact Email:</span>
            <a href="mailto:${ADMIN_EMAIL}" style="color:#38bdf8; font-size:15px; font-weight:700; text-decoration:none;">✉️ ${ADMIN_EMAIL}</a>
          </div>
        </div>

        <p style="font-size:13px; color:#94a3b8; margin-top:20px;">
          Please include your registered name and account details in your correspondence.
        </p>
      `,
      buttonText: 'Email Admin Directly ✉️',
      buttonUrl: `mailto:${ADMIN_EMAIL}?subject=Breakup%20Buddy%20Profile%20Revocation%20Inquiry%20-${encodeURIComponent(displayName)}`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: '⚠️ Notice: Your Breakup Buddy Profile Has Been Revoked - Contact Admin - JabWeMeet',
      html,
    });
    console.log(`[Mailer] Buddy Revoked email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] Buddy Revoked:`, err.message);
  }
}

// ==========================================
// 3. EVENT MANAGEMENT & TICKETS
// ==========================================

/** Host Event Published */
async function sendEventPublishedEmail({ hostEmail, hostName, eventTitle, eventDate, eventCity }) {
  if (!hostEmail) return;
  try {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = wrapTemplate({
      title: 'Event Published - JabWeMeet',
      badge: { text: '🚀 Event Live & Public', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Your Event is Live, ${hostName}! 🎉</h2>
        <p>Great news! Admin has reviewed and published your event to the main JabWeMeet event explorer.</p>
        <div class="card">
          <div style="margin-bottom:8px;">
            <span style="color:#94a3b8; font-size:12px;">Event:</span>
            <strong style="color:#ffffff; font-size:16px; display:block;">${eventTitle}</strong>
          </div>
          <div style="margin-bottom:8px;">
            <span style="color:#94a3b8; font-size:12px;">Date & Time:</span>
            <strong style="color:#818cf8; display:block;">📅 ${formattedDate}</strong>
          </div>
          <div>
            <span style="color:#94a3b8; font-size:12px;">City / Location:</span>
            <span style="color:#e2e8f0; display:block;">📍 ${eventCity}</span>
          </div>
        </div>
        <p>Members can now purchase passes and RSVP. Track bookings in your Host Dashboard.</p>
      `,
      buttonText: 'View Event in Host Portal 🎪',
      buttonUrl: `${FRONTEND_URL}/host/events`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: hostEmail,
      subject: `🎉 Your Event "${eventTitle}" is Now LIVE on JabWeMeet!`,
      html,
    });
    console.log(`[Mailer] Event Published email sent to ${hostEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Event Published:`, err.message);
  }
}

/** Event Cancelled or Rescheduled Notice */
async function sendEventCancelledOrUpdatedEmail({ attendeeEmail, attendeeName, eventTitle, eventDate, status, reason }) {
  if (!attendeeEmail) return;
  try {
    const isCancelled = status === 'CANCELLED' || status === 'ARCHIVED';
    const html = wrapTemplate({
      title: `${isCancelled ? 'Event Cancellation' : 'Event Update'} - JabWeMeet`,
      badge: {
        text: isCancelled ? '❌ Event Cancelled' : '📅 Event Rescheduled',
        type: isCancelled ? 'badge-rose' : 'badge-warning',
      },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${attendeeName || 'Member'},</h2>
        <p>We are writing to notify you about an important update regarding your upcoming event: <strong style="color:#ffffff;">${eventTitle}</strong>.</p>
        <div class="card" style="border-left:4px solid ${isCancelled ? '#f43f5e' : '#f59e0b'};">
          <p style="margin:0 0 6px 0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Status & Reason:</p>
          <p style="margin:0; color:#ffffff; font-size:15px; font-weight:600;">Status: <span style="color:${isCancelled ? '#fda4af' : '#fbbf24'};">${status}</span></p>
          ${reason ? `<p style="margin:8px 0 0 0; color:#cbd5e1; font-style:italic;">"${reason}"</p>` : ''}
        </div>
        ${isCancelled ? `
          <p style="color:#34d399; font-weight:600;">💰 If you paid for this event ticket, a full 100% refund has been initiated to your original payment method automatically.</p>
        ` : `
          <p>Please check your attendee portal for the latest schedule, updated venue map, and instructions.</p>
        `}
      `,
      buttonText: 'View My Bookings 🎟️',
      buttonUrl: `${FRONTEND_URL}/dashboard?tab=events`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: attendeeEmail,
      subject: `${isCancelled ? '❌ Important Notice: Event Cancelled' : '📅 Update:'} "${eventTitle}" - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Event Cancelled/Updated email sent to ${attendeeEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Event Cancelled/Updated:`, err.message);
  }
}

/** Resend / Manual Event Ticket Pass */
async function sendEventTicketResendEmail({ attendeeEmail, attendeeName, eventTitle, eventDate, eventLocation, ticketCode, qrCode }) {
  if (!attendeeEmail) return;
  try {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = wrapTemplate({
      title: 'Your Event Pass - JabWeMeet',
      badge: { text: '🎟️ Official Ticket Pass', type: 'badge-purple' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Here is Your Ticket Pass, ${attendeeName}! ✨</h2>
        <p>Get ready for an exciting experience! Present your digital pass or ticket code at the venue check-in desk.</p>
        <div class="card" style="text-align:center; background:linear-gradient(135deg, #18223c, #1e1b4b); border:2px dashed rgba(168,85,247,0.4);">
          <h3 style="color:#ffffff; margin:0 0 6px 0; font-size:18px;">${eventTitle}</h3>
          <p style="color:#c084fc; margin:0 0 16px 0; font-weight:600;">📅 ${formattedDate}</p>
          <p style="color:#94a3b8; font-size:13px; margin:0 0 20px 0;">📍 ${eventLocation || 'Partner Venue'}</p>
          
          <div style="background:#0b1120; border-radius:12px; padding:16px; display:inline-block; margin-bottom:12px;">
            <p style="margin:0 0 4px 0; color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Ticket Pass Code</p>
            <span style="font-family:monospace; font-size:22px; font-weight:900; color:#34d399; letter-spacing:3px;">${ticketCode}</span>
          </div>
        </div>
        <p style="font-size:13px; color:#94a3b8; text-align:center;">Please arrive 15 minutes before the start time. Smart casual dress code recommended.</p>
      `,
      buttonText: 'View in My Tickets 🎟️',
      buttonUrl: `${FRONTEND_URL}/dashboard?tab=events`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: attendeeEmail,
      subject: `🎟️ Your Ticket Pass for "${eventTitle}" [Code: ${ticketCode}] - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Ticket Pass email sent to ${attendeeEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Ticket Pass:`, err.message);
  }
}

/** 24-Hour Event Reminder Email sent to attendees from host */
async function sendEvent24hReminderEmail({
  attendeeEmail,
  attendeeName,
  eventTitle,
  eventDate,
  eventLocation,
  eventCity,
  spots,
  ticketCode,
  hostName,
  hostEmail,
  hostPhone,
}) {
  if (!attendeeEmail) return;
  try {
    const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const organizer = hostName || 'Event Host';
    const html = wrapTemplate({
      title: `Event Tomorrow Reminder: ${eventTitle} - JabWeMeet`,
      badge: { text: '⏰ Event is Tomorrow!', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Tomorrow is Your Big Event, ${attendeeName || 'Friend'}! 🌟</h2>
        <p>This is a friendly reminder that your upcoming JabWeMeet event <strong style="color:#e06d53;">"${eventTitle}"</strong> is taking place <strong>TOMORROW</strong>!</p>
        
        <div class="card" style="border-left:4px solid #f59e0b; background:linear-gradient(135deg, #18223c, #1f1d36);">
          <h3 style="color:#ffffff; margin:0 0 12px 0; font-size:18px;">📋 Event & Schedule Details</h3>
          <div class="highlight-row">
            <span class="highlight-label">Event Name:</span>
            <span class="highlight-val">${eventTitle}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Host / Organizer:</span>
            <span class="highlight-val" style="color:#fbbf24;">${organizer}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Date & Time:</span>
            <span class="highlight-val" style="color:#38bdf8;">📅 ${formattedDate}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Venue Location:</span>
            <span class="highlight-val">📍 ${eventLocation}, ${eventCity}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Passes Booked:</span>
            <span class="highlight-val">${spots || 1} Spot(s)</span>
          </div>
          ${ticketCode ? `
            <div class="highlight-row" style="border-bottom:none;">
              <span class="highlight-label">Digital Pass Code:</span>
              <span class="highlight-val" style="font-family:monospace; color:#34d399; letter-spacing:1.5px; background:rgba(52,211,153,0.1); padding:2px 8px; border-radius:6px;">${ticketCode}</span>
            </div>
          ` : ''}
        </div>

        <div class="card" style="background:#0f172a; border:1px solid rgba(245,158,11,0.25);">
          <p style="margin:0 0 8px 0; color:#fbbf24; font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">💡 Tips for Tomorrow:</p>
          <ul style="margin:0; padding-left:18px; color:#cbd5e1; font-size:13px; line-height:1.7;">
            <li>Please arrive <strong>15 minutes early</strong> for smooth check-in and greeting.</li>
            <li>Have your digital ticket code ready on your phone or in your email.</li>
            <li>Dress comfortably (smart-casual recommended for singles mixers and socials).</li>
            <li>Come with an open mind, ready to connect and meet amazing people!</li>
          </ul>
        </div>

        <div style="background:rgba(224,109,83,0.1); border-left:4px solid #e06d53; border-radius:8px; padding:14px 18px; margin:20px 0;">
          <p style="margin:0; color:#cbd5e1; font-size:13px; font-style:italic;">
            "We are preparing a wonderful experience for you tomorrow. Can't wait to see you there!"
            <br/><strong style="color:#ffffff; font-style:normal;">— ${organizer} (Event Host)</strong>
          </p>
        </div>

        ${hostPhone ? `
          <p style="font-size:12px; color:#94a3b8; margin:16px 0 0 0;">
            Need help or venue directions tomorrow? Reach host at: <strong style="color:#ffffff;">${hostPhone}</strong>
          </p>
        ` : ''}
      `,
      buttonText: 'View My Ticket Pass 🎟️',
      buttonUrl: `${FRONTEND_URL}/dashboard?tab=events`,
    });

    const fromHeader = `"${organizer} via JabWeMeet" <${process.env.MAIL_USERNAME || 'yogithamgowdayogitha@gmail.com'}>`;

    await transporter.sendMail({
      from: fromHeader,
      to: attendeeEmail,
      replyTo: hostEmail || undefined,
      subject: `⏰ Reminder: Your Event "${eventTitle}" is Tomorrow! [Pass: ${ticketCode || 'Ready'}]`,
      html,
    });
    console.log(`[Mailer] 24h Event Reminder sent to ${attendeeEmail} for "${eventTitle}"`);
  } catch (err) {
    console.error(`[Mailer Error] 24h Event Reminder:`, err.message);
  }
}

// ==========================================
// 4. REFUNDS, INVOICES & PAYMENTS
// ==========================================

/** Refund Processed Confirmation */
async function sendRefundProcessedEmail({ userEmail, userName, amount, refundId, referenceId, reason }) {
  if (!userEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Refund Processed - JabWeMeet',
      badge: { text: '💰 Refund Processed', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Refund Processed, ${userName || 'Member'}! ✅</h2>
        <p>A refund has been approved and successfully initiated by our accounts team.</p>
        <div class="card">
          <div class="highlight-row">
            <span class="highlight-label">Refund Amount:</span>
            <span class="highlight-val" style="color:#34d399; font-size:16px;">₹${parseFloat(amount).toFixed(2)}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Refund ID:</span>
            <span class="highlight-val" style="font-family:monospace;">${refundId}</span>
          </div>
          ${referenceId ? `
            <div class="highlight-row">
              <span class="highlight-label">Payment Ref:</span>
              <span class="highlight-val" style="font-family:monospace;">${referenceId}</span>
            </div>
          ` : ''}
          ${reason ? `
            <div style="margin-top:10px;">
              <span class="highlight-label">Reason:</span>
              <p style="margin:4px 0 0 0; color:#e2e8f0; font-size:13px;">${reason}</p>
            </div>
          ` : ''}
        </div>
        <p style="font-size:13px; color:#94a3b8;">The credited amount will reflect in your original bank account/card within <strong>5–7 business days</strong> depending on your bank.</p>
      `,
      buttonText: 'View Payment History 💳',
      buttonUrl: `${FRONTEND_URL}/dashboard?tab=payments`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: `💰 Refund Confirmation: ₹${parseFloat(amount).toFixed(2)} Processed - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Refund email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Refund:`, err.message);
  }
}

/** Invoice / Payment Receipt */
async function sendInvoiceEmail({ userEmail, userName, invoiceNumber, amount, paymentType, gateway, date }) {
  if (!userEmail) return;
  try {
    const formattedDate = new Date(date || Date.now()).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const html = wrapTemplate({
      title: `Invoice ${invoiceNumber} - JabWeMeet`,
      badge: { text: '🧾 Payment Receipt', type: 'badge-info' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Payment Receipt & Invoice 🧾</h2>
        <p>Thank you for your payment on JabWeMeet. Here is your official transaction summary:</p>
        <div class="card">
          <div class="highlight-row">
            <span class="highlight-label">Invoice Number:</span>
            <span class="highlight-val" style="font-family:monospace;">${invoiceNumber}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Date:</span>
            <span class="highlight-val">${formattedDate}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Service Type:</span>
            <span class="highlight-val">${paymentType || 'Platform Service'}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Payment Mode:</span>
            <span class="highlight-val">${gateway || 'Razorpay / Online'}</span>
          </div>
          <div class="highlight-row" style="border-bottom:none; margin-bottom:0; padding-bottom:0;">
            <span class="highlight-label" style="font-size:15px; color:#ffffff; font-weight:700;">Total Paid:</span>
            <span class="highlight-val" style="color:#34d399; font-size:18px; font-weight:900;">₹${parseFloat(amount).toFixed(2)}</span>
          </div>
        </div>
        <p style="font-size:12px; color:#64748b;">This receipt serves as official proof of payment. For billing disputes, contact support@jabweemeet.com.</p>
      `,
      buttonText: 'View Invoice Details 📄',
      buttonUrl: `${FRONTEND_URL}/dashboard?tab=payments`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: `🧾 Official Payment Receipt [${invoiceNumber}] - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Invoice email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Invoice:`, err.message);
  }
}

// ==========================================
// 5. SUPPORT & HELPDESK
// ==========================================

/** Staff Reply to Support Ticket */
async function sendSupportTicketReplyEmail({ userEmail, userName, ticketNumber, subject, replyMessage, staffName }) {
  if (!userEmail) return;
  try {
    const html = wrapTemplate({
      title: `Support Ticket Reply - #${ticketNumber}`,
      badge: { text: '🎧 Support Desk Reply', type: 'badge-info' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${userName || 'Member'},</h2>
        <p>Our customer support team has replied to your support ticket <strong style="color:#818cf8; font-family:monospace;">#${ticketNumber}</strong>.</p>
        <div class="card" style="background:#131c30; border-left:4px solid #6366f1;">
          <p style="margin:0 0 6px 0; color:#94a3b8; font-size:12px; font-weight:700;">Ticket Subject: <span style="color:#ffffff;">${subject}</span></p>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.06); margin:12px 0;">
          <p style="margin:0 0 4px 0; color:#818cf8; font-size:12px; font-weight:700;">${staffName || 'Support Executive'} wrote:</p>
          <p style="margin:0; color:#ffffff; line-height:1.6; font-size:14px; white-space:pre-wrap;">${replyMessage}</p>
        </div>
        <p>You can view the full discussion history and respond directly through your support portal.</p>
      `,
      buttonText: 'View Ticket & Reply 💬',
      buttonUrl: `${FRONTEND_URL}/support`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: `💬 New Reply on Support Ticket #${ticketNumber}: "${subject}" - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Support Reply email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Support Reply:`, err.message);
  }
}

/** Support Ticket Resolved Notice */
async function sendSupportTicketResolvedEmail({ userEmail, userName, ticketNumber, subject }) {
  if (!userEmail) return;
  try {
    const html = wrapTemplate({
      title: `Ticket Resolved - #${ticketNumber}`,
      badge: { text: '✅ Ticket Resolved', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Ticket Resolved, ${userName || 'Member'}! 🌟</h2>
        <p>Your support ticket <strong style="color:#34d399; font-family:monospace;">#${ticketNumber}</strong> (${subject}) has been marked as <strong style="color:#34d399;">RESOLVED</strong>.</p>
        <div class="card">
          <p style="margin:0; color:#94a3b8; font-size:13px;">If you have further questions or if your issue is not fully resolved, you can reopen this ticket by replying anytime.</p>
        </div>
        <p>Thank you for being a valued member of the JabWeMeet community!</p>
      `,
      buttonText: 'Go to Helpdesk 🎧',
      buttonUrl: `${FRONTEND_URL}/support`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: `✅ Support Ticket #${ticketNumber} Has Been Resolved - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Support Resolved email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Support Resolved:`, err.message);
  }
}

/** Admin Alert for High Priority Ticket */
async function sendHighPriorityTicketAdminAlert({ ticketNumber, subject, userName, userEmail, priority, description }) {
  try {
    const html = wrapTemplate({
      title: `🚨 Urgent Ticket #${ticketNumber}`,
      badge: { text: `🚨 ${priority || 'HIGH'} PRIORITY`, type: 'badge-rose' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Urgent Support Escalation! ⚠️</h2>
        <p>A member has submitted an escalated support ticket requiring immediate administrator attention.</p>
        <div class="card" style="border-left:4px solid #f43f5e;">
          <div class="highlight-row">
            <span class="highlight-label">Ticket #:</span>
            <span class="highlight-val" style="font-family:monospace;">${ticketNumber}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">User:</span>
            <span class="highlight-val">${userName} (${userEmail})</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Subject:</span>
            <span class="highlight-val" style="color:#fda4af;">${subject}</span>
          </div>
          <div style="margin-top:10px;">
            <span class="highlight-label">Description:</span>
            <p style="margin:4px 0 0 0; color:#ffffff; font-size:13px; background:#0b1120; padding:10px; border-radius:8px;">${description}</p>
          </div>
        </div>
      `,
      buttonText: 'Open Ticket in Admin Desk 🚨',
      buttonUrl: `${FRONTEND_URL}/admin/support`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: ADMIN_EMAIL,
      subject: `🚨 [URGENT] High Priority Support Ticket #${ticketNumber} from ${userName}`,
      html,
    });
    console.log(`[Mailer] High Priority Ticket alert sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error(`[Mailer Error] High Priority Alert:`, err.message);
  }
}

// ==========================================
// 6. SAFETY & COMMUNITY MODERATION
// ==========================================

/** Safety Report Resolved (Update to Reporting User) */
async function sendSafetyReportResolvedEmail({ reporterEmail, reporterName, reportCategory, actionTaken }) {
  if (!reporterEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Safety Report Update - JabWeMeet',
      badge: { text: '🛡️ Trust & Safety Update', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${reporterName || 'Member'},</h2>
        <p>Thank you for helping us keep JabWeMeet a safe, respectful space for everyone.</p>
        <p>Our Trust & Safety team has thoroughly investigated your recent report regarding <strong style="color:#818cf8;">${reportCategory || 'Community Safety'}</strong>.</p>
        <div class="card" style="border-left:4px solid #10b981;">
          <p style="margin:0 0 4px 0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">Resolution:</p>
          <p style="margin:0; color:#34d399; font-weight:600;">${actionTaken || 'Appropriate administrative action has been enforced in accordance with our Community Standards.'}</p>
        </div>
        <p>Your privacy and confidentiality are fully protected. Thank you for your proactive vigilance!</p>
      `,
      buttonText: 'Our Safety Guidelines 🛡️',
      buttonUrl: `${FRONTEND_URL}/safety`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: reporterEmail,
      subject: '🛡️ Update Regarding Your Safety Report — JabWeMeet Trust Desk',
      html,
    });
    console.log(`[Mailer] Safety Report Resolved email sent to ${reporterEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Safety Report Resolved:`, err.message);
  }
}

/** Official Safety Warning to Offending User */
async function sendUserSafetyWarningEmail({ userEmail, userName, reason }) {
  if (!userEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Official Community Warning - JabWeMeet',
      badge: { text: '⚠️ Official Warning', type: 'badge-rose' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Notice to ${userName || 'Member'},</h2>
        <p>Our Trust & Safety team has received reports regarding activity on your profile that violates the JabWeMeet Community Guidelines.</p>
        <div class="card" style="border-left:4px solid #f43f5e; background:#1c1322;">
          <p style="margin:0 0 6px 0; color:#fda4af; font-size:12px; font-weight:700; text-transform:uppercase;">Violation Details:</p>
          <p style="margin:0; color:#ffffff; font-size:14px;">"${reason || 'Disrespectful behavior, harassment, or inappropriate conduct reported.'}"</p>
        </div>
        <p style="color:#fda4af; font-weight:600;">⚠️ Please note: Future violations will result in permanent account termination and forfeiture of all service passes.</p>
      `,
      buttonText: 'Review Community Rules 📜',
      buttonUrl: `${FRONTEND_URL}/safety`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: '⚠️ Important: Official Community Warning Notice — JabWeMeet',
      html,
    });
    console.log(`[Mailer] Safety Warning email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Safety Warning:`, err.message);
  }
}

// ==========================================
// 7. BROADCAST ANNOUNCEMENTS & COUPONS
// ==========================================

/** Admin Broadcast Notification Blast */
async function sendBroadcastAnnouncementEmail({ recipientEmail, recipientName, title, message, announcementType }) {
  if (!recipientEmail) return;
  try {
    const html = wrapTemplate({
      title: title || 'Announcement - JabWeMeet',
      badge: { text: `📢 ${announcementType || 'Platform Update'}`, type: 'badge-purple' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">${title}</h2>
        <p style="color:#94a3b8; font-size:13px;">Hi ${recipientName || 'Member'}, here's an official announcement from JabWeMeet:</p>
        <div class="card" style="font-size:15px; line-height:1.7; color:#f1f5f9; white-space:pre-wrap;">
${message}
        </div>
        <p>Stay connected and check out the latest mixers and features on our web app!</p>
      `,
      buttonText: 'Open JabWeMeet 🚀',
      buttonUrl: FRONTEND_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipientEmail,
      subject: `📢 ${title} — JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Broadcast email sent to ${recipientEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Broadcast:`, err.message);
  }
}

/** Promotional Coupon / Voucher */
async function sendCouponPromoEmail({ userEmail, userName, code, discountAmount, discountType, minOrderAmount, expiryDate }) {
  if (!userEmail) return;
  try {
    const discountLabel = discountType === 'PERCENTAGE' ? `${discountAmount}% OFF` : `₹${discountAmount} FLAT OFF`;
    const formattedExpiry = expiryDate ? new Date(expiryDate).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) : 'Limited Time';

    const html = wrapTemplate({
      title: 'A Special Gift For You! - JabWeMeet',
      badge: { text: '🎁 Special Voucher', type: 'badge-rose' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">A Special Gift For You, ${userName}! 🎉</h2>
        <p>We're thrilled to have you in the JabWeMeet family. Here is an exclusive promotional voucher for your next booking:</p>
        <div class="card" style="text-align:center; background:linear-gradient(135deg, #24132c, #131d33); border:2px dashed #ec4899;">
          <p style="margin:0 0 6px 0; color:#e06d53; font-size:18px; font-weight:800;">${discountLabel}</p>
          <div style="background:#0b1120; border-radius:12px; padding:14px 28px; display:inline-block; margin:10px 0;">
            <span style="font-family:monospace; font-size:24px; font-weight:900; color:#38bdf8; letter-spacing:4px;">${code}</span>
          </div>
          <p style="margin:8px 0 0 0; color:#94a3b8; font-size:12px;">Valid until <strong>${formattedExpiry}</strong> ${minOrderAmount > 0 ? `• Min order ₹${minOrderAmount}` : ''}</p>
        </div>
        <p>Apply this coupon code at checkout when booking any event mixer or breakup buddy pass!</p>
      `,
      buttonText: 'Redeem Voucher Now 🎁',
      buttonUrl: `${FRONTEND_URL}/dashboard?tab=packages`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: userEmail,
      subject: `🎁 Special Gift! Get ${discountLabel} with Code: ${code} — JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Coupon email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Coupon:`, err.message);
  }
}

// ==========================================
// 8. BREAKUP BUDDY USER EMAILS (EXISTING)
// ==========================================

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
          <div class="highlight-row">
            <span class="highlight-label">User:</span>
            <span class="highlight-val">${userName}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Session Format:</span>
            <span class="highlight-val" style="color:#818cf8;">${sessionFormat || 'Chat & Voice Call'}</span>
          </div>
          <div>
            <span class="highlight-label">Topic / Note:</span>
            <p style="margin:4px 0 0 0; color:#e2e8f0; font-style:italic;">"${topic || '1-on-1 Emotional Support Session'}"</p>
          </div>
        </div>
        <p>Please log in to your dashboard to review this request and connect.</p>
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
    console.error(`[Mailer Error] Connection Request:`, err.message);
  }
}

async function sendRequestClaimedByOtherEmail({ buddyEmail, buddyName, userName }) {
  if (!buddyEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Request Claimed - JabWeMeet',
      badge: { text: '🔒 Session Claimed by Peer', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hi ${buddyName || 'Breakup Buddy'},</h2>
        <p>A recent emotional support connection request on JabWeMeet has just been accepted and claimed by another Breakup Buddy.</p>
        <div class="card" style="background:rgba(245, 158, 11, 0.08); border-color:rgba(245, 158, 11, 0.3);">
          <p style="margin:0; color:#fde68a; font-size:14px;">
            ⚠️ <strong>Notice:</strong> You were a bit late to accept this request from <strong>${userName || 'a member'}</strong>. It is now assigned to another Breakup Buddy.
          </p>
        </div>
        <p style="margin-top:16px; color:#94a3b8;">
          No action is needed from you. Keep your dashboard open to accept future requests!
        </p>
      `,
      buttonText: 'Open Buddy Dashboard 👉',
      buttonUrl: DASHBOARD_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: buddyEmail,
      subject: `🔒 Connection Request Claimed by Another Breakup Buddy - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Request Claimed email sent to ${buddyEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Request Claimed:`, err.message);
  }
}

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
          <div class="highlight-row">
            <span class="highlight-label">Package:</span>
            <span class="highlight-val">${packageName || `${durationHours}h Pass`}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Duration:</span>
            <span class="highlight-val" style="color:#818cf8;">${durationHours} Unlimited</span>
          </div>
          <div class="highlight-row" style="border-bottom:none;">
            <span class="highlight-label">Amount Credited:</span>
            <span class="highlight-val" style="color:#34d399; font-size:18px;">₹${amountEarned || 0}</span>
          </div>
        </div>
        <p>The user has unlimited calls and chat enabled. Please be available to provide compassionate support!</p>
      `,
      buttonText: 'Open Buddy Chat & Calls 💬',
      buttonUrl: DASHBOARD_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: buddyEmail,
      subject: `💰 Earning Alert: ${userName} Bought a Pass (₹${amountEarned}) with You! - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Pass Purchased email sent to ${buddyEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Pass Purchased:`, err.message);
  }
}

async function sendNewReviewEmail({ buddyEmail, buddyName, userName, rating, comment }) {
  if (!buddyEmail) return;
  try {
    const stars = '⭐'.repeat(Math.max(1, Math.min(5, Math.round(rating || 5))));
    const html = wrapTemplate({
      title: 'New Review Received - JabWeMeet',
      badge: { text: '⭐ New Review', type: 'badge-warning' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">You Received a New Review, ${buddyName}! ⭐</h2>
        <p>A client has submitted feedback for their recent session with you.</p>
        <div class="card">
          <div class="highlight-row">
            <span class="highlight-label">Client:</span>
            <span class="highlight-val">${userName || 'Anonymous Client'}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Rating:</span>
            <span class="highlight-val" style="font-size:16px;">${stars} (${rating || 5}/5)</span>
          </div>
          ${comment ? `
            <div>
              <span class="highlight-label">Client Feedback:</span>
              <p style="margin:4px 0 0 0; color:#e2e8f0; font-style:italic;">"${comment}"</p>
            </div>
          ` : ''}
        </div>
      `,
      buttonText: 'View All Reviews ⭐',
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
    console.error(`[Mailer Error] New Review:`, err.message);
  }
}

async function sendMissedCallEmail({ buddyEmail, email, userEmail, buddyName, name, callerName }) {
  const recipient = buddyEmail || email || userEmail;
  if (!recipient) return;
  try {
    const displayName = buddyName || name || 'Buddy';
    const html = wrapTemplate({
      title: 'Missed Call Alert - JabWeMeet',
      badge: { text: '📞 Missed Call', type: 'badge-rose' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${displayName},</h2>
        <p>You missed an incoming voice call from <strong style="color:#ffffff;">${callerName || 'a client'}</strong>.</p>
        <div class="card">
          <p style="margin:0; color:#e2e8f0;">
            Caller: <strong style="color:#ffffff;">${callerName || 'Client'}</strong><br>
            Time: <span style="color:#94a3b8;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
      `,
      buttonText: 'Open Buddy Dashboard 📞',
      buttonUrl: DASHBOARD_URL,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: `📞 Missed Call Alert from ${callerName || 'Client'} - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Missed call email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] Missed Call:`, err.message);
  }
}

/** Session Scheduled / Request Accepted by Buddy */
async function sendSessionScheduledEmail({ userEmail, email, userName, name, buddyName, scheduledAt, durationMinutes, sessionType }) {
  const recipient = userEmail || email;
  if (!recipient) return;
  try {
    const displayName = userName || name || 'Member';
    const formattedDate = new Date(scheduledAt || Date.now()).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const html = wrapTemplate({
      title: 'Session Confirmed - JabWeMeet Breakup Buddy',
      badge: { text: '💖 Session Confirmed', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Session Confirmed with ${buddyName || 'Your Buddy'}! 💖</h2>
        <p>Hello ${displayName}, your Breakup Buddy <strong style="color:#ffffff;">${buddyName || 'Buddy'}</strong> has confirmed your session schedule.</p>
        <div class="card" style="border-left:4px solid #34d399;">
          <div class="highlight-row">
            <span class="highlight-label">Buddy:</span>
            <span class="highlight-val">${buddyName || 'Breakup Buddy'}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Scheduled For:</span>
            <span class="highlight-val" style="color:#818cf8;">📅 ${formattedDate}</span>
          </div>
          <div class="highlight-row">
            <span class="highlight-label">Format:</span>
            <span class="highlight-val">${sessionType || '1-on-1 Voice Call & Chat'}</span>
          </div>
          <div class="highlight-row" style="border-bottom:none;">
            <span class="highlight-label">Duration:</span>
            <span class="highlight-val">${durationMinutes || 45} Minutes</span>
          </div>
        </div>
        <p>Please be online 5 minutes before your session time. You can chat or call directly from your Breakup Buddy portal.</p>
      `,
      buttonText: 'Open Breakup Buddy Portal 💬',
      buttonUrl: `${FRONTEND_URL}/breakup-buddy`,
    });

    await transporter.sendMail({
      from: FROM_HEADER,
      to: recipient,
      subject: `💖 Session Confirmed with ${buddyName || 'Your Buddy'} for ${formattedDate} - JabWeMeet`,
      html,
    });
    console.log(`[Mailer] Session Scheduled email sent to ${recipient}`);
  } catch (err) {
    console.error(`[Mailer Error] Session Scheduled:`, err.message);
  }
}

/** Live Admin SMTP Diagnostic / Test Email */
async function sendTestEmail({ toEmail, email, subject, previewNote }) {
  const targetEmail = toEmail || email || process.env.MAIL_USERNAME || 'yogithamgowdayogitha@gmail.com';
  try {
    const html = wrapTemplate({
      title: 'JabWeMeet Mailer Test ✨',
      badge: { text: '⚡ Live SMTP Dispatch Test', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">SMTP Connection Verified! 🚀✨</h2>
        <p>This is a live test email from the <strong>JabWeMeet Admin Engine</strong>.</p>
        <div class="card" style="background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.1));">
          <p style="margin:0 0 6px 0; color:#94a3b8; font-size:12px; font-weight:700; text-transform:uppercase;">System Status:</p>
          <p style="margin:0; color:#34d399; font-size:16px; font-weight:bold;">✅ Email Subsystem is 100% Active & Operational!</p>
          <p style="margin:8px 0 0 0; color:#cbd5e1; font-size:13px;">${previewNote || 'All transactional and administrative templates (Verifications, Approvals, Event Passes, Refunds, Invoices, Support Replies, Safety Moderations, Broadcasts) are linked and working.'}</p>
        </div>
        <p style="color:#94a3b8; font-size:12px;">Sent at: ${new Date().toLocaleString()}</p>
      `,
      buttonText: 'Open Admin Dashboard 🛡️',
      buttonUrl: `${FRONTEND_URL}/admin`,
    });

    const info = await transporter.sendMail({
      from: FROM_HEADER,
      to: targetEmail,
      subject: subject || '✨ [Test Email] JabWeMeet Mail Service Connected Successfully',
      html,
    });
    console.log(`[Mailer] Test email sent successfully to ${targetEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId, recipient: targetEmail };
  } catch (err) {
    console.error(`[Mailer Error] Test Email:`, err.message);
    throw err;
  }
}


/** Registration OTP */
async function sendRegistrationOTP({ userEmail, userName, otp }) {
  if (!userEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Your Registration OTP - JabWeMeet',
      badge: { text: '🔐 Verification', type: 'badge-info' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Hello ${userName || 'Member'},</h2>
        <p>Thank you for registering on JabWeMeet. Please use the following One-Time Password (OTP) to complete your registration:</p>
        <div class="card" style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #ec4899;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #94a3b8;">This OTP is valid for 10 minutes.</p>
      `,
    });
    await transporter.sendMail({ from: FROM_HEADER, to: userEmail, subject: 'Your JabWeMeet Registration OTP', html });
  } catch (err) {}
}

/** Registration Success */
async function sendRegistrationSuccessEmail({ userEmail, userName, role }) {
  if (!userEmail) return;
  try {
    let extraContent = '';
    if (role === 'MATCHMAKER' || role === 'BREAKUP_BUDDY' || role === 'HOST') {
      extraContent = '<p>Your application has been received and is currently under review by our admin team. You will be notified once approved.</p>';
    }
    const html = wrapTemplate({
      title: 'Registration Successful - JabWeMeet',
      badge: { text: '🎉 Welcome', type: 'badge-success' },
      contentHtml: `
        <h2 style="color:#ffffff; margin-top:0;">Welcome to JabWeMeet, ${userName || 'Member'}! 🎉</h2>
        <p>Your registration was successful.</p>
        ${extraContent}
      `,
      buttonText: 'Login Now',
      buttonUrl: `${FRONTEND_URL}/login`,
    });
    await transporter.sendMail({ from: FROM_HEADER, to: userEmail, subject: '🎉 Welcome to JabWeMeet! Registration Successful', html });
  } catch (err) {}
}

module.exports = {
  sendRegistrationOTP,
  sendRegistrationSuccessEmail,
  sendPasswordResetEmail,
  transporter,
  // Diagnostic
  sendTestEmail,
  // User & Verification
  sendUserVerificationApprovedEmail,
  sendUserVerificationRejectedEmail,
  sendUserStatusUpdatedEmail,
  // Partner Approvals & Revocations
  sendRMApprovedEmail,
  sendRMRejectedEmail,
  sendRMRevokedEmail,
  sendHostApprovedEmail,
  sendHostRejectedEmail,
  sendHostRevokedEmail,
  sendBuddyApprovedEmail,
  sendBuddyRejectedEmail,
  sendBuddyRevokedEmail,
  // Events & Tickets
  sendEventPublishedEmail,
  sendEventCancelledOrUpdatedEmail,
  sendEventTicketResendEmail,
  sendEvent24hReminderEmail,
  // Refunds & Invoices
  sendRefundProcessedEmail,
  sendInvoiceEmail,
  // Support
  sendSupportTicketReplyEmail,
  sendSupportTicketResolvedEmail,
  sendHighPriorityTicketAdminAlert,
  // Safety
  sendSafetyReportResolvedEmail,
  sendUserSafetyWarningEmail,
  // Broadcasts & Coupons
  sendBroadcastAnnouncementEmail,
  sendCouponPromoEmail,
  // Buddy Emails
  sendNewConnectionRequestEmail,
  sendRequestClaimedByOtherEmail,
  sendPassPurchasedEmail,
  sendNewReviewEmail,
  sendMissedCallEmail,
  sendSessionScheduledEmail,
};


async function sendPasswordResetEmail({ userEmail, userName, resetToken }) {
  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
  const htmlBody = `
    <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;'>
      <h2 style='color: #e06d53; text-align: center;'>Password Reset Request</h2>
      <p>Hi <b>${userName || 'User'}</b>,</p>
      <p>We received a request to reset your JabWeMeet password. If you didn't make this request, you can safely ignore this email.</p>
      <p>Click the button below to set a new password:</p>
      <div style='text-align: center; margin: 30px 0;'>
        <a href='${resetLink}' style='background: #e06d53; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style='word-break: break-all; color: #555; font-size: 14px;'>${resetLink}</p>
      <hr style='border: 0; border-top: 1px solid #eee; margin: 30px 0;' />
      <p style='font-size: 12px; color: #777; text-align: center;'>JabWeMeet Team</p>
    </div>
  `;
  try {
    await transporter.sendMail({
      from: '"JabWeMeet Notifications" <yogithamgowdayogitha@gmail.com>',
      to: userEmail,
      subject: 'Reset your JabWeMeet password',
      html: htmlBody,
    });
    console.log(`[Mailer] Password reset email sent to ${userEmail}`);
  } catch (err) {
    console.error(`[Mailer Error] Password Reset:`, err.message);
  }
}
