const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('crops')
      .select('id, crop_name, season, soil_type, ideal_temperature, growth_duration, water_requirement')
      .order('crop_name');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
