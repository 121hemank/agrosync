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
    const { year } = req.query;
    const filterYear = year || new Date().getFullYear();

    const { data } = await supabase
      .from('analytics')
      .select('*')
      .eq('farmer_id', req.user.id)
      .eq('year', filterYear)
      .order('month', { ascending: true });

    res.json(data || []);
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
