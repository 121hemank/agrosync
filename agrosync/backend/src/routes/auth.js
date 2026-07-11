const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { sendOTP } = require('../services/email');

const router = express.Router();

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('otps').insert({ email, otp, expires_at: expiresAt });
    await sendOTP(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP & Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, otp, role } = req.body;

    const { data: otpData } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!otpData) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const existing = await supabase.from('users').select('id').eq('email', email).single();
    if (existing.data) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase.from('users').insert({
      name, email, phone, password_hash: passwordHash,
      role: role || 'buyer', status: 'active'
    }).select().single();

    if (error) throw error;

    await supabase.from('otps').update({ used: true }).eq('id', otpData.id);

    const tokens = generateTokens(user);
    const refreshTokenStr = uuidv4();
    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: refreshTokenStr,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    res.status(201).json({ user, ...tokens, refreshToken: refreshTokenStr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Account not active' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const tokens = generateTokens(user);
    const refreshTokenStr = uuidv4();
    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: refreshTokenStr,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    delete user.password_hash;
    res.json({ user, ...tokens, refreshToken: refreshTokenStr });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const { data: stored } = await supabase
      .from('refresh_tokens')
      .select('*, users(*)')
      .eq('token', refreshToken)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!stored) return res.status(401).json({ error: 'Invalid refresh token' });

    await supabase.from('refresh_tokens').delete().eq('id', stored.id);

    const user = stored.users;
    const tokens = generateTokens(user);
    const newRefreshToken = uuidv4();
    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: newRefreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    delete user.password_hash;
    res.json({ user, ...tokens, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('otps').insert({ email, otp, expires_at: expiresAt });
    await sendOTP(email, otp);

    res.json({ message: 'OTP sent for password reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const { data: otpData } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (!otpData) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await supabase.from('users').update({ password_hash: passwordHash }).eq('email', email);
    await supabase.from('otps').update({ used: true }).eq('id', otpData.id);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await supabase.from('refresh_tokens').delete().eq('token', refreshToken);
    }
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
