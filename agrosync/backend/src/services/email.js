const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let transporter = null;
let resend = null;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

function buildHtml(title, body) {
  return `<div style="font-family:Arial;max-width:480px;margin:0 auto">
    <h2 style="color:#2E7D32">AgroSync AI</h2>
    ${body}
  </div>`;
}

async function sendViaNodemailer(to, subject, html) {
  if (!transporter) throw new Error('SMTP not configured');
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  await transporter.sendMail({ from, to, subject, html });
}

async function sendViaResend(to, subject, html) {
  if (!resend) throw new Error('Resend not configured');
  const from = process.env.RESEND_FROM || 'AgroSync AI <onboarding@resend.dev>';
  await resend.emails.send({ from, to, subject, html });
}

async function sendOTP(email, otp) {
  const subject = 'Your OTP for AgroSync AI Registration';
  const html = buildHtml(subject, `
    <p>Your OTP for registration is:</p>
    <h1 style="color:#2E7D32;font-size:32px;letter-spacing:6px">${otp}</h1>
    <p>This OTP expires in 10 minutes.</p>
  `);

  if (transporter) {
    try {
      await sendViaNodemailer(email, subject, html);
      return;
    } catch (err) {
      console.error('Nodemailer failed, trying Resend:', err.message);
    }
  }

  if (resend) {
    try {
      await sendViaResend(email, subject, html);
      return;
    } catch (err) {
      console.error('Resend also failed:', err.message);
    }
  }

  throw new Error('No email service available. Configure SMTP_HOST/SMTP_USER or RESEND_API_KEY.');
}

async function sendNotification(email, title, message) {
  const html = buildHtml(title, `<p>${message}</p>`);

  if (transporter) {
    try {
      await sendViaNodemailer(email, title, html);
      return;
    } catch (err) {
      console.error('Nodemailer failed, trying Resend:', err.message);
    }
  }

  if (resend) {
    try {
      await sendViaResend(email, title, html);
      return;
    } catch (err) {
      console.error('Resend also failed:', err.message);
    }
  }

  console.error('No email service available to send notification');
}

module.exports = { sendOTP, sendNotification };