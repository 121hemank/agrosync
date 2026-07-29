const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const DATA_GOV_API = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a8f6c2e6f0a6';
const API_KEY = process.env.DATA_GOV_API_KEY;

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

const CROP_ALIASES = {
  'Rice': ['rice', 'paddy', 'dhan'],
  'Wheat': ['wheat', 'gehu'],
  'Maize': ['maize', 'corn', 'makka'],
  'Cotton': ['cotton', 'kapas'],
  'Sugarcane': ['sugarcane', 'ganna'],
  'Soybean': ['soybean', 'soya'],
  'Groundnut': ['groundnut', 'moongfali', 'peanut'],
  'Potato': ['potato', 'aloo'],
  'Onion': ['onion', 'pyaaz'],
  'Tomato': ['tomato', 'tamatar'],
  'Chilli': ['chilli', 'mirch'],
  'Turmeric': ['turmeric', 'haldi'],
  'Banana': ['banana', 'kela'],
  'Mango': ['mango', 'aam'],
  'Apple': ['apple', 'seb'],
  'Tea': ['tea', 'chai', 'chaha'],
  'Coffee': ['coffee'],
  'Blackgram': ['blackgram', 'urad', 'urd'],
  'Mungbean': ['mungbean', 'moong', 'green gram'],
  'Chickpea': ['chickpea', 'chana', 'bengal gram']
};

function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function matchCrop(commodity) {
  if (!commodity) return null;
  const lower = commodity.toLowerCase().trim();
  for (const [ourCrop, aliases] of Object.entries(CROP_ALIASES)) {
    if (aliases.some(a => lower.includes(a))) return ourCrop;
  }
  return null;
}

async function fetchFromDataGov() {
  if (!API_KEY) return null;

  const today = new Date().toISOString().split('T')[0];
  const allRecords = [];
  let offset = 0;
  const limit = 1000;
  let total = null;

  while (total === null || offset < total) {
    const url = `${DATA_GOV_API}?api-key=${API_KEY}&format=json&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 403) return null;
      throw new Error(`data.gov.in API error: ${response.status}`);
    }
    const data = await response.json();
    if (!data.records || data.records.length === 0) break;

    allRecords.push(...data.records);
    total = data.total || allRecords.length;
    offset += limit;
    if (total && offset >= total) break;
  }

  const mapped = [];
  const seen = new Set();

  for (const r of allRecords) {
    const cropName = matchCrop(r.commodity);
    if (!cropName) continue;

    const priceDate = parseDate(r.arrival_date);
    const key = `${cropName}|${r.market}|${priceDate}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const modal = parseFloat(r.modal_price) || 0;
    const minP = parseFloat(r.min_price) || 0;
    const maxP = parseFloat(r.max_price) || 0;

    mapped.push({
      crop_name: cropName,
      market_name: (r.market || '').trim(),
      state: (r.state || '').trim(),
      price_per_quintal: modal || ((minP + maxP) / 2),
      min_price: minP,
      max_price: maxP,
      modal_price: modal,
      price_date: priceDate,
      source: 'data.gov.in'
    });
  }

  return mapped;
}

let lastFetchDate = null;
let cachedApiPrices = null;

async function getOrFetchPrices() {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('market_prices')
    .select('*')
    .eq('price_date', today)
    .order('created_at', { ascending: false })
    .limit(1);

  const hasTodayData = existing && existing.length > 0;

  if (API_KEY && lastFetchDate !== today) {
    try {
      const apiPrices = await fetchFromDataGov();
      if (apiPrices && apiPrices.length > 0) {
        await supabase.from('market_prices').delete().eq('price_date', today).eq('source', 'data.gov.in');
        const chunks = [];
        for (let i = 0; i < apiPrices.length; i += 500) {
          chunks.push(apiPrices.slice(i, i + 500));
        }
        for (const chunk of chunks) {
          await supabase.from('market_prices').insert(chunk);
        }
        lastFetchDate = today;
        cachedApiPrices = apiPrices;
        return { prices: apiPrices, source: 'data.gov.in' };
      }
    } catch (err) {
      console.error('Failed to fetch from data.gov.in:', err.message);
    }
  }

  if (hasTodayData) {
    const { data } = await supabase
      .from('market_prices')
      .select('*')
      .eq('price_date', today)
      .order('crop_name');
    if (data && data.length > 0) {
      return { prices: data, source: data[0].source || 'unknown' };
    }
  }

  return { prices: [], source: 'none' };
}

async function ensureTodayPrices() {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('market_prices')
    .select('id')
    .eq('price_date', today)
    .limit(1);

  if (existing && existing.length > 0) return;

  const generated = generateMarketPrices();
  await supabase.from('market_prices').insert(generated);
}

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

// GET / - list market prices
router.get('/', async (req, res) => {
  try {
    const { crop, market, state, date } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const targetDate = date || today;

    const { prices, source } = await getOrFetchPrices();

    let results = prices;

    if (results.length === 0) {
      const generated = generateMarketPrices();
      const { data: inserted } = await supabase.from('market_prices').insert(generated).select();
      results = inserted || [];
    }

    if (crop) results = results.filter(p => p.crop_name.toLowerCase().includes(crop.toLowerCase()));
    if (market) results = results.filter(p => p.market_name.toLowerCase().includes(market.toLowerCase()));
    if (state) results = results.filter(p => (p.state || '').toLowerCase().includes(state.toLowerCase()));
    if (date) results = results.filter(p => p.price_date === date);

    res.json({ data: results, source: results[0]?.source || 'auto-generated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique crops with prices
router.get('/crops', async (req, res) => {
  try {
    await ensureTodayPrices();

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
    await ensureTodayPrices();

    const { data, error } = await supabase
      .from('market_prices')
      .select('crop_name, price_per_quintal, min_price, max_price, market_name, price_date')
      .order('price_date', { ascending: false })
      .limit(500);

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

// Refresh prices (fetch from API if configured, otherwise generate)
router.post('/refresh', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    await supabase
      .from('market_prices')
      .delete()
      .eq('price_date', today);

    if (API_KEY) {
      try {
        const apiPrices = await fetchFromDataGov();
        if (apiPrices && apiPrices.length > 0) {
          const chunks = [];
          for (let i = 0; i < apiPrices.length; i += 500) {
            chunks.push(apiPrices.slice(i, i + 500));
          }
          for (const chunk of chunks) {
            await supabase.from('market_prices').insert(chunk);
          }
          lastFetchDate = today;
          cachedApiPrices = apiPrices;
          return res.json({ message: 'Prices refreshed from data.gov.in', count: apiPrices.length, prices: apiPrices, source: 'data.gov.in' });
        }
      } catch (err) {
        console.error('API refresh failed:', err.message);
      }
    }

    const generated = generateMarketPrices();
    const { data, error } = await supabase.from('market_prices').insert(generated).select();
    if (error) throw error;

    res.json({ message: 'Prices refreshed (estimated)', count: data.length, prices: data, source: 'auto-generated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
