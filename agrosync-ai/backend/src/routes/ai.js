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
    const { farm_id, soil_type, temperature, rainfall, humidity, season } = req.body;

    let farmSoilType = soil_type;

    if (farm_id) {
      const { data: farm } = await supabase
        .from('farms')
        .select('soil_type')
        .eq('id', farm_id)
        .eq('user_id', req.user.id)
        .single();

      if (!farm) return res.status(404).json({ error: 'Farm not found' });
      farmSoilType = soil_type || farm.soil_type;
    }

    const result = await aiService.getCropRecommendation({
      soil_type: farmSoilType,
      temperature,
      rainfall,
      humidity,
      season
    });

    if (farm_id) {
      await supabase.from('crop_recommendations').insert({
        farm_id,
        recommended_crop: result.recommended_crop,
        confidence: result.confidence,
        reason: result.reason,
        weather_score: result.weather_score
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Predict harvest
router.post('/predict-harvest', async (req, res) => {
  try {
    const { farm_id, crop_id, planted_date, soil_type, area } = req.body;

    const result = await aiService.predictHarvest({
      crop_id, planted_date, soil_type, area
    });

    await supabase.from('harvest_predictions').insert({
      farm_id, crop_id,
      expected_date: result.expected_date,
      expected_yield: result.expected_yield,
      confidence: result.confidence
    });

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
