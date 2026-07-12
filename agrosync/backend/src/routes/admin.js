const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const { count: totalUsers } = await supabase
      .from('users').select('*', { count: 'exact', head: true });

    const { count: totalFarmers } = await supabase
      .from('users').select('*', { count: 'exact', head: true }).eq('role', 'farmer');

    const { count: totalBuyers } = await supabase
      .from('users').select('*', { count: 'exact', head: true }).eq('role', 'buyer');

    const { count: totalProducts } = await supabase
      .from('marketplace_products').select('*', { count: 'exact', head: true });

    const { count: totalOrders } = await supabase
      .from('orders').select('*', { count: 'exact', head: true });

    const { count: pendingFarmers } = await supabase
      .from('users').select('*', { count: 'exact', head: true }).eq('role', 'farmer').eq('status', 'pending');

    res.json({ totalUsers, totalFarmers, totalBuyers, totalProducts, totalOrders, pendingFarmers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manage users
router.get('/users', async (req, res) => {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, name, email, phone, role, status, created_at')
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/reject farmer
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    const { data: notif } = await supabase.from('notifications').insert({
      user_id: req.params.id,
      title: status === 'active' ? 'Account Approved' : 'Account Suspended',
      message: `Your account has been ${status}`,
      type: 'account'
    }).select().single();

    const io = req.app.get('io');
    if (notif) io.to(`user:${req.params.id}`).emit('new-notification', notif);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All products
router.get('/products', async (req, res) => {
  try {
    const { data } = await supabase
      .from('marketplace_products')
      .select('*, users!marketplace_products_farmer_id_fkey(name)')
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All orders
router.get('/orders', async (req, res) => {
  try {
    const { data } = await supabase
      .from('orders')
      .select('*, users!orders_buyer_id_fkey(name), users!orders_farmer_id_fkey(name)')
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revenue overview
router.get('/analytics', async (req, res) => {
  try {
    const { data: completedOrders } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('status', 'completed');

    const totalRevenue = completedOrders?.reduce((s, o) => s + Number(o.total || 0), 0) || 0;

    const monthlyRevenue = {};
    completedOrders?.forEach(o => {
      const month = new Date(o.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(o.total || 0);
    });

    res.json({ totalRevenue, monthlyRevenue, totalOrders: completedOrders?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
