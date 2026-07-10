require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farms');
const weatherRoutes = require('./routes/weather');
const marketplaceRoutes = require('./routes/marketplace');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const cropRoutes = require('./routes/crops');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/crops', cropRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AgroSync AI backend running on port ${PORT}`);
});
