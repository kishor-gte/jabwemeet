let transporter;

try {
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_PORT == 465,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });
} catch (err) {
  console.warn('⚠️ [JabWeMeet EmailService] "nodemailer" not installed or failed to load. Outgoing emails will be logged instead of failing.');
  transporter = {
    sendMail: async (options) => {
      console.log(`[JabWeMeet EmailService Sim] To: ${options.to} | Subject: ${options.subject}`);
      return { messageId: 'simulated-' + Date.now() };
    },
  };
}

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

    const info = await transporter.sendMail(mailOptions);
    console.log(`📬 [Email Sent] to: ${recipient} | Subject: "${subject}" | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ [Email Error] to: ${to} | Reason:`, error.message || error);
    return null;
  }
};

module.exports = { sendMail };
