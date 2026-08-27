const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public: List available products
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort } = req.query;
    let query = supabase
      .from('marketplace_products')
      .select('*, product_images(*), crops(*), users!marketplace_products_farmer_id_fkey(name, avatar_url)')
      .eq('status', 'available');

    if (search) query = query.ilike('title', `%${search}%`);
    if (category) query = query.eq('category', category);
    if (minPrice) query = query.gte('price', minPrice);
    if (maxPrice) query = query.lte('price', maxPrice);
    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public: Get single product
router.get('/:id', async (req, res) => {
  try {
    const { data } = await supabase
      .from('marketplace_products')
      .select('*, product_images(*), crops(*), users!marketplace_products_farmer_id_fkey(name, avatar_url, phone)')
      .eq('id', req.params.id)
      .single();
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth required below
router.use(authenticate);

// Farmer: Create product
router.post('/', authorize('farmer'), upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, quantity, unit, category, farm_id, crop_id } = req.body;

    const { data: product, error } = await supabase.from('marketplace_products').insert({
      farmer_id: req.user.id, farm_id, crop_id, title, description,
      price, quantity, unit, category, status: 'available'
    }).select().single();

    if (error) throw error;

    if (req.files && req.files.length > 0) {
      const imageRecords = [];
      for (const file of req.files) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `products/${product.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('agrosync')
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('agrosync').getPublicUrl(fileName);
          imageRecords.push({ product_id: product.id, image_url: publicUrl });
        }
      }
      if (imageRecords.length > 0) {
        await supabase.from('product_images').insert(imageRecords);
      }
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer: Update product
router.put('/:id', authorize('farmer'), async (req, res) => {
  try {
    const { title, description, price, quantity, unit, category, status } = req.body;
    const { data, error } = await supabase
      .from('marketplace_products')
      .update({ title, description, price, quantity, unit, category, status, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('farmer_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer: Delete product
router.delete('/:id', authorize('farmer'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('marketplace_products')
      .delete()
      .eq('id', req.params.id)
      .eq('farmer_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer: Get my products
router.get('/my/listings', authorize('farmer'), async (req, res) => {
  try {
    const { data } = await supabase
      .from('marketplace_products')
      .select('*, product_images(*), crops(*)')
      .eq('farmer_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
