const fs = require('fs');
const path = 'backend/utils/mailer.js';
let content = fs.readFileSync(path, 'utf8');

const funcStr = `
/** Registration OTP */
async function sendRegistrationOTP({ userEmail, userName, otp }) {
  if (!userEmail) return;
  try {
    const html = wrapTemplate({
      title: 'Your Registration OTP - JabWeMeet',
      badge: { text: '🔐 Verification', type: 'badge-info' },
      contentHtml: \`
        <h2 style="color:#ffffff; margin-top:0;">Hello \${userName || 'Member'},</h2>
        <p>Thank you for registering on JabWeMeet. Please use the following One-Time Password (OTP) to complete your registration:</p>
        <div class="card" style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #ec4899;">
          \${otp}
        </div>
        <p style="font-size: 12px; color: #94a3b8;">This OTP is valid for 10 minutes.</p>
      \`,
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
      contentHtml: \`
        <h2 style="color:#ffffff; margin-top:0;">Welcome to JabWeMeet, \${userName || 'Member'}! 🎉</h2>
        <p>Your registration was successful.</p>
        \${extraContent}
      \`,
      buttonText: 'Login Now',
      buttonUrl: \`\${FRONTEND_URL}/login\`,
    });
    await transporter.sendMail({ from: FROM_HEADER, to: userEmail, subject: '🎉 Welcome to JabWeMeet! Registration Successful', html });
  } catch (err) {}
}
`;

content = content.replace('module.exports = {', funcStr + '\nmodule.exports = {\n  sendRegistrationOTP,\n  sendRegistrationSuccessEmail,');
fs.writeFileSync(path, content);
console.log("Patched mailer.js");
