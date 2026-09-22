let transporter;

try {
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
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

const sendMail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"JabWeMeet" <${process.env.MAIL_USERNAME}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendMail };
