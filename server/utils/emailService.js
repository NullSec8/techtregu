const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('[Email] SMTP not configured - emails disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: port === '465',
    auth: { user, pass },
  });

  console.log('[Email] SMTP configured');
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) return { success: false, reason: 'SMTP not configured' };

  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || '"TechTregu" <noreply@techtregu.com>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    return { success: false, error: err.message };
  }
}

function buildPasswordResetEmail(email, resetToken, baseUrl) {
  const url = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  return {
    subject: 'Reset your TechTregu password',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your TechTregu account.</p>
        <p>
          <a href="${url}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Reset Password
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">
          This link expires in 15 minutes. If you didn't request this, please ignore this email.
        </p>
        <p style="color: #94a3b8; font-size: 12px;">
          TechTregu - Kosovo's Tech Marketplace
        </p>
      </div>
    `,
  };
}

function buildWelcomeEmail(username, baseUrl) {
  return {
    subject: 'Welcome to TechTregu!',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>Welcome, ${username}!</h2>
        <p>Thanks for joining TechTregu, Kosovo's marketplace for tech hardware.</p>
        <p>You can now:</p>
        <ul>
          <li>Browse and search listings</li>
          <li>Create your own listings</li>
          <li>Message sellers directly</li>
        </ul>
        <p>
          <a href="${baseUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Start Browsing
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px;">
          Happy shopping!
        </p>
        <p style="color: #94a3b8; font-size: 12px;">
          TechTregu - Kosovo's Tech Marketplace
        </p>
      </div>
    `,
  };
}

function buildNewMessageEmail(recipientName, senderName, listingTitle, messagePreview, baseUrl) {
  return {
    subject: `New message from ${senderName} about "${listingTitle}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>New message</h2>
        <p><strong>${senderName}</strong> sent you a message about <em>${listingTitle}</em>:</p>
        <blockquote style="background: #f8fafc; padding: 12px; border-left: 3px solid #7c3aed; margin: 16px 0;">
          ${messagePreview}
        </blockquote>
        <p>
          <a href="${baseUrl}/messages" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            View Messages
          </a>
        </p>
        <p style="color: #94a3b8; font-size: 12px;">
          TechTregu - Kosovo's Tech Marketplace
        </p>
      </div>
    `,
  };
}

module.exports = {
  sendMail,
  buildPasswordResetEmail,
  buildWelcomeEmail,
  buildNewMessageEmail,
};