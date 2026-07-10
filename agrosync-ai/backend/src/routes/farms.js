const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

// Get all farms for user
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single farm
router.get('/:id', async (req, res) => {
  try {
    const { data } = await supabase
      .from('farms')
      .select('*, farm_images(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    if (!data) return res.status(404).json({ error: 'Farm not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create farm
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { farm_name, location, latitude, longitude, soil_type, area, area_unit } = req.body;

    const { data: farm, error } = await supabase.from('farms').insert({
      user_id: req.user.id,
      farm_name,
      location,
      latitude,
      longitude,
      soil_type,
      area,
      area_unit
    }).select().single();

    if (error) throw error;

    if (req.files && req.files.length > 0) {
      const imageRecords = [];
      for (const file of req.files) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `farms/${farm.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('agrosync')
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('agrosync').getPublicUrl(fileName);
          imageRecords.push({ farm_id: farm.id, image_url: publicUrl });
        }
      }
      if (imageRecords.length > 0) {
        await supabase.from('farm_images').insert(imageRecords);
      }
    }

    res.status(201).json(farm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update farm
router.put('/:id', async (req, res) => {
  try {
    const { farm_name, location, latitude, longitude, soil_type, area, area_unit } = req.body;
    const { data, error } = await supabase
      .from('farms')
      .update({ farm_name, location, latitude, longitude, soil_type, area, area_unit })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Farm not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete farm
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('farms')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Farm deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get crops for a farm
router.get('/:id/crops', async (req, res) => {
  try {
    const { data } = await supabase
      .from('user_crops')
      .select('*, crops(*)')
      .eq('farm_id', req.params.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plant a crop
router.post('/:id/crops', async (req, res) => {
  try {
    const { crop_id, planted_date, area_used } = req.body;
    const { data, error } = await supabase.from('user_crops').insert({
      farm_id: req.params.id,
      crop_id,
      planted_date,
      area_used,
      status: 'growing'
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update crop status
router.patch('/:id/crops/:cropId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['growing', 'harvested', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('user_crops')
      .update({ status })
      .eq('id', req.params.cropId)
      .eq('farm_id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Crop not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
