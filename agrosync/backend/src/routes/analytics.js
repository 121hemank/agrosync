const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Farmer dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: farms } = await supabase.from('farms').select('id').eq('user_id', userId);
    const farmIds = farms?.map(f => f.id) || [];

    const { data: products } = await supabase
      .from('marketplace_products')
      .select('id, price, quantity, status')
      .eq('farmer_id', userId);

    const totalProducts = products?.length || 0;
    const activeListings = products?.filter(p => p.status === 'available').length || 0;

    const { data: orders } = await supabase
      .from('orders')
      .select('status, total')
      .eq('farmer_id', userId);

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.filter(o => o.status === 'completed').reduce((s, o) => s + Number(o.total || 0), 0) || 0;

    const { data: crops } = await supabase
      .from('user_crops')
      .select('*, crops(crop_name)')
      .in('farm_id', farmIds);

    const growing = crops?.filter(c => c.status === 'growing').length || 0;

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .in('product_id', products?.map(p => p.id) || []);

    const avgRating = reviews?.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    res.json({
      totalFarms: farmIds.length,
      totalProducts,
      activeListings,
      totalOrders,
      totalRevenue,
      cropsGrowing: growing,
      averageRating: Math.round(avgRating * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const { year, farm_id } = req.query;
    const targetYear = year || new Date().getFullYear();

    let orderQuery = supabase
      .from('orders')
      .select('total, created_at, status')
      .eq('farmer_id', req.user.id)
      .eq('status', 'completed')
      .gte('created_at', `${targetYear}-01-01T00:00:00Z`)
      .lte('created_at', `${targetYear}-12-31T23:59:59Z`);

    if (farm_id) {
      const { data: farmProducts } = await supabase
        .from('marketplace_products')
        .select('id')
        .eq('farm_id', farm_id);
      const productIds = farmProducts?.map(p => p.id) || [];
      if (productIds.length === 0) return res.json({ monthly: [], daily: [], total: 0, ordersCount: 0 });

      const { data: farmOrders } = await supabase
        .from('order_items')
        .select('order_id')
        .in('product_id', productIds);
      const orderIds = [...new Set(farmOrders?.map(o => o.order_id) || [])];
      if (orderIds.length === 0) return res.json({ monthly: [], daily: [], total: 0, ordersCount: 0 });

      orderQuery = orderQuery.in('id', orderIds);
    }

    const { data: orders, error } = await orderQuery;
    if (error) throw error;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = Array(12).fill(0);
    const dailyMap = new Map();
    let total = 0;

    (orders || []).forEach(o => {
      const d = new Date(o.created_at);
      const month = d.getMonth();
      const dayKey = d.toISOString().split('T')[0];
      monthly[month] += Number(o.total || 0);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + Number(o.total || 0));
      total += Number(o.total || 0);
    });

    const daily = [...dailyMap.entries()]
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      monthly: months.map((name, i) => ({ name, month: i + 1, revenue: monthly[i] })),
      daily,
      total,
      ordersCount: orders?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crop analytics
router.get('/crops', async (req, res) => {
  try {
    const { data: farms } = await supabase.from('farms').select('id').eq('user_id', req.user.id);
    const farmIds = farms?.map(f => f.id) || [];

    const { data } = await supabase
      .from('user_crops')
      .select('*, crops(crop_name)')
      .in('farm_id', farmIds)
      .order('created_at', { ascending: false });

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Market price trends
router.get('/market-trends', async (req, res) => {
  try {
    const { data } = await supabase
      .from('marketplace_products')
      .select('crop_id, crops(crop_name), price, created_at')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(100);

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buyer analytics
router.get('/buyer', async (req, res) => {
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', req.user.id);

    const totalOrders = orders?.length || 0;
    const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
    const totalSpent = orders?.filter(o => o.status === 'completed').reduce((s, o) => s + Number(o.total || 0), 0) || 0;

    res.json({ totalOrders, completedOrders, totalSpent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
