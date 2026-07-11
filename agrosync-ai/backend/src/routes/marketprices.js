const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Indian crops with typical price ranges (INR per quintal)
const CROP_RANGES = {
  'Rice': { min: 1800, max: 2800, avg: 2200 },
  'Wheat': { min: 2000, max: 2600, avg: 2250 },
  'Maize': { min: 1600, max: 2200, avg: 1850 },
  'Cotton': { min: 5500, max: 7500, avg: 6400 },
  'Sugarcane': { min: 280, max: 380, avg: 315 },
  'Soybean': { min: 3500, max: 5000, avg: 4200 },
  'Groundnut': { min: 4500, max: 6000, avg: 5200 },
  'Potato': { min: 800, max: 1800, avg: 1200 },
  'Onion': { min: 1000, max: 3500, avg: 1800 },
  'Tomato': { min: 1200, max: 4000, avg: 2100 },
  'Chilli': { min: 8000, max: 18000, avg: 12000 },
  'Turmeric': { min: 6000, max: 12000, avg: 8500 },
  'Banana': { min: 1000, max: 2500, avg: 1600 },
  'Mango': { min: 1500, max: 5000, avg: 2800 },
  'Apple': { min: 3000, max: 8000, avg: 5000 },
  'Tea': { min: 15000, max: 28000, avg: 20000 },
  'Coffee': { min: 10000, max: 18000, avg: 14000 },
  'Blackgram': { min: 5000, max: 8000, avg: 6500 },
  'Mungbean': { min: 4500, max: 7000, avg: 5800 },
  'Chickpea': { min: 4000, max: 6500, avg: 5200 }
};

const INDIAN_MARKETS = [
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Kanpur', state: 'Uttar Pradesh' },
  { name: 'Coimbatore', state: 'Tamil Nadu' }
];

function generateMarketPrices() {
  const prices = [];
  const today = new Date().toISOString().split('T')[0];

  Object.entries(CROP_RANGES).forEach(([crop, base]) => {
    const numMarkets = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...INDIAN_MARKETS].sort(() => Math.random() - 0.5).slice(0, numMarkets);

    shuffled.forEach(market => {
      const variation = 0.85 + Math.random() * 0.30;
      const price = Math.round(base.avg * variation);
      const minP = Math.round(price * 0.92);
      const maxP = Math.round(price * 1.08);

      prices.push({
        crop_name: crop,
        market_name: market.name,
        state: market.state,
        price_per_quintal: price,
        min_price: minP,
        max_price: maxP,
        modal_price: price,
        price_date: today,
        source: 'auto-generated'
      });
    });
  });
  return prices;
}

// Get market prices
router.get('/', async (req, res) => {
  try {
    const { crop, market, state, date } = req.query;
    let query = supabase
      .from('market_prices')
      .select('*')
      .order('price_date', { ascending: false });

    if (crop) query = query.ilike('crop_name', `%${crop}%`);
    if (market) query = query.ilike('market_name', `%${market}%`);
    if (state) query = query.ilike('state', `%${state}%`);
    if (date) query = query.eq('price_date', date);

    const { data, error } = await query.limit(100);
    if (error) throw error;

    if (!data || data.length === 0) {
      const generated = generateMarketPrices();
      const { data: inserted } = await supabase.from('market_prices').insert(generated).select();
      return res.json(inserted || []);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique crops with prices
router.get('/crops', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_prices')
      .select('crop_name')
      .order('crop_name');

    if (error) throw error;
    const uniqueCrops = [...new Set((data || []).map(d => d.crop_name))];
    res.json(uniqueCrops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get price history for a specific crop
router.get('/history/:cropName', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .ilike('crop_name', req.params.cropName)
      .order('price_date', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market summary (average prices by crop)
router.get('/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('market_prices')
      .select('crop_name, price_per_quintal')
      .order('price_date', { ascending: false })
      .limit(200);

    if (error) throw error;

    const summary = (data || []).reduce((acc, p) => {
      if (!acc[p.crop_name]) acc[p.crop_name] = { prices: [] };
      acc[p.crop_name].prices.push(p.price_per_quintal);
      return acc;
    }, {});

    const result = Object.entries(summary).map(([crop, info]) => ({
      crop_name: crop,
      avg_price: Math.round(info.prices.reduce((a, b) => a + b, 0) / info.prices.length),
      min_price: Math.min(...info.prices),
      max_price: Math.max(...info.prices),
      market_count: info.prices.length
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh prices (regenerate with slight variations)
router.post('/refresh', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    await supabase
      .from('market_prices')
      .delete()
      .eq('price_date', today)
      .eq('source', 'auto-generated');

    const generated = generateMarketPrices();
    const { data, error } = await supabase.from('market_prices').insert(generated).select();
    if (error) throw error;

    res.json({ message: 'Prices refreshed', count: data.length, prices: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
