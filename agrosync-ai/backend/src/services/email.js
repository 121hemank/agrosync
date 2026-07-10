const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTP(email, otp) {
  try {
    await resend.emails.send({
      from: 'AgroSync AI <onboarding@resend.dev>',
      to: email,
      subject: 'Your OTP for AgroSync AI Registration',
      html: `<div style="font-family:Arial;max-width:480px;margin:0 auto">
        <h2 style="color:#2E7D32">AgroSync AI</h2>
        <p>Your OTP for registration is:</p>
        <h1 style="color:#2E7D32;font-size:32px;letter-spacing:6px">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
      </div>`
    });
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

async function sendNotification(email, title, message) {
  try {
    await resend.emails.send({
      from: 'AgroSync AI <onboarding@resend.dev>',
      to: email,
      subject: title,
      html: `<div style="font-family:Arial;max-width:480px;margin:0 auto">
        <h2 style="color:#2E7D32">AgroSync AI</h2>
        <p>${message}</p>
      </div>`
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}

module.exports = { sendOTP, sendNotification };
