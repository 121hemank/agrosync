const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');
const aiService = require('../services/ai');

const router = express.Router();

router.use(authenticate);
router.use(authorize('farmer'));

// Get crop recommendation
router.post('/recommend-crop', async (req, res) => {
  try {
    const { farm_id } = req.body;

    const nitrogen = parseFloat(req.body.nitrogen);
    const phosphorus = parseFloat(req.body.phosphorus);
    const potassium = parseFloat(req.body.potassium);
    const temperature = parseFloat(req.body.temperature);
    const humidity = parseFloat(req.body.humidity);
    const ph = parseFloat(req.body.ph);
    const rainfall = parseFloat(req.body.rainfall);

    if ([nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall].some(v => Number.isNaN(v))) {
      return res.status(400).json({ error: 'All 7 parameters (nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall) are required' });
    }

    const result = await aiService.getCropRecommendation({
      nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall
    });

    if (farm_id) {
      const { data: farm } = await supabase
        .from('farms')
        .select('id')
        .eq('id', farm_id)
        .eq('user_id', req.user.id)
        .single();

      if (farm) {
        await supabase.from('crop_recommendations').insert({
          farm_id,
          recommended_crop: result.recommended_crop,
          confidence: result.confidence,
          reason: result.reason,
          suitability_score: result.suitability_score
        });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Predict harvest
router.post('/predict-harvest', async (req, res) => {
  try {
    const { farm_id } = req.body;

    const result = await aiService.predictHarvest(req.body);

    if (farm_id) {
      await supabase.from('harvest_predictions').insert({
        farm_id,
        expected_date: result.expected_date,
        expected_yield: result.expected_yield,
        confidence: result.confidence
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Predict yield
router.post('/predict-yield', async (req, res) => {
  try {
    const result = await aiService.predictYield(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recommendations history
router.get('/recommendations/:farmId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('crop_recommendations')
      .select('*')
      .eq('farm_id', req.params.farmId)
      .order('created_at', { ascending: false })
      .limit(10);
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get harvest predictions
router.get('/harvest-predictions/:farmId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('harvest_predictions')
      .select('*, crops(crop_name)')
      .eq('farm_id', req.params.farmId)
      .order('created_at', { ascending: false })
      .limit(10);
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
