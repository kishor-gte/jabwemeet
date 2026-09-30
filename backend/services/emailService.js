const { sendQueuedMail, enqueueEmail, transporter } = require('./emailQueue');

const sendMail = async (to, subject, text, html, fromName, replyTo) => {
  try {
    const recipient = (to || '').trim();
    if (!recipient || !recipient.includes('@')) {
      console.warn(`⚠️ [JabWeMeet EmailService] Invalid recipient address skipped: "${to}"`);
      return null;
    }

    const fromAddress = process.env.MAIL_USERNAME || 'noreply@jabweemeet.com';
    const cleanFromName = (fromName || 'JabWeMeet').replace(/["\r\n]/g, '');
    const sender = `"${cleanFromName}" <${fromAddress}>`;
    
    const mailOptions = {
      from: sender,
      to: recipient,
      subject: subject || 'Notification from JabWeMeet',
      text: text || '',
      html: html || '',
    };

    if (replyTo && replyTo.includes('@')) {
      mailOptions.replyTo = replyTo.trim();
    }

    const info = await sendQueuedMail(mailOptions);
    console.log(`📬 [Email Queued] to: ${recipient} | Subject: "${subject}"`);
    return info;
  } catch (error) {
    console.error(`❌ [Email Error] to: ${to} | Reason:`, error.message || error);
    return null;
  }
};

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendMail, escapeHtml };
