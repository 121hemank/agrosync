const nodemailer = require('nodemailer');
const https = require('https');
const { Resend } = require('resend');

let transporter = null;
let resend = null;
let sendgridKey = null;

// Prefer the SendGrid Web API (HTTPS) when a key is available. SendGrid SMTP
// and Gmail SMTP are blocked on cloud free tiers (Render blocks SMTP ports
// 25/465/587), whereas the Web API runs over HTTPS (443) and is never blocked.
if (process.env.SENDGRID_API_KEY || (process.env.SMTP_HOST === 'smtp.sendgrid.net' && process.env.SMTP_PASS)) {
  sendgridKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
}

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
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

function sendViaSendgrid(to, subject, html) {
  const fromRaw = process.env.EMAIL_FROM || `AgroSync AI <${process.env.SMTP_USER}>`;
  const fromMatch = fromRaw.match(/^(.*)<([^>]+)>$/);
  const from = fromMatch
    ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() }
    : { email: fromRaw.trim() };

  const payload = JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from,
    subject,
    content: [{ type: 'text/html', value: html }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body });
          } else {
            reject(new Error(`SendGrid API ${res.statusCode}: ${body}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error('SendGrid API timed out'));
    });
    req.write(payload);
    req.end();
  });
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

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Email send timed out after ${ms}ms`)), ms))
  ]);
}

async function sendOTP(email, otp) {
  const subject = 'Your OTP for AgroSync AI Registration';
  const html = buildHtml(subject, `
    <p>Your OTP for registration is:</p>
    <h1 style="color:#2E7D32;font-size:32px;letter-spacing:6px">${otp}</h1>
    <p>This OTP expires in 10 minutes.</p>
  `);

  if (sendgridKey) {
    try {
      await withTimeout(sendViaSendgrid(email, subject, html), 12000);
      return;
    } catch (err) {
      console.error('SendGrid API failed, trying next provider:', err.message);
    }
  }

  if (transporter) {
    try {
      await withTimeout(sendViaNodemailer(email, subject, html), 12000);
      return;
    } catch (err) {
      console.error('Nodemailer failed, trying Resend:', err.message);
    }
  }

  if (resend) {
    try {
      await withTimeout(sendViaResend(email, subject, html), 12000);
      return;
    } catch (err) {
      console.error('Resend also failed:', err.message);
    }
  }

  throw new Error('No email service available. Configure SENDGRID_API_KEY / SMTP_HOST or RESEND_API_KEY.');
}

async function sendNotification(email, title, message) {
  const html = buildHtml(title, `<p>${message}</p>`);

  if (sendgridKey) {
    try {
      await withTimeout(sendViaSendgrid(email, title, html), 12000);
      return;
    } catch (err) {
      console.error('SendGrid API failed, trying next provider:', err.message);
    }
  }

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
