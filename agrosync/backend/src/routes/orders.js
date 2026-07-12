const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Buyer: Create order
router.post('/', authorize('buyer'), async (req, res) => {
  try {
    const { items, notes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });

    const productIds = items.map(i => i.product_id);
    const { data: products } = await supabase
      .from('marketplace_products')
      .select('*')
      .in('id', productIds);

    if (!products || products.length !== items.length) {
      return res.status(400).json({ error: 'Some products not found' });
    }

    // Check all from same farmer
    const farmerId = products[0].farmer_id;
    if (products.some(p => p.farmer_id !== farmerId)) {
      return res.status(400).json({ error: 'All items must be from same farmer' });
    }

    let total = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product || product.status !== 'available') {
        return res.status(400).json({ error: `${product?.title || 'Product'} not available` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient quantity for ${product.title}` });
      }
      total += product.price * item.quantity;
    }

    const { data: order, error } = await supabase.from('orders').insert({
      buyer_id: req.user.id,
      farmer_id: farmerId,
      status: 'pending',
      total,
      notes
    }).select().single();

    if (error) throw error;

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: products.find(p => p.id === item.product_id).price
    }));

    await supabase.from('order_items').insert(orderItems);

    // Reduce quantities
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      const newQty = product.quantity - item.quantity;
      const newStatus = newQty <= 0 ? 'out_of_stock' : 'available';
      await supabase.from('marketplace_products')
        .update({ quantity: Math.max(newQty, 0), status: newStatus, updated_at: new Date() })
        .eq('id', item.product_id);
    }

    // Notify farmer
    const { data: notif } = await supabase.from('notifications').insert({
      user_id: farmerId,
      title: 'New Order Received',
      message: `Order #${order.id.slice(0, 8)} has been placed`,
      type: 'order'
    }).select().single();

    const io = req.app.get('io');
    if (notif) io.to(`user:${farmerId}`).emit('new-notification', notif);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buyer: My orders
router.get('/my-orders', authorize('buyer'), async (req, res) => {
  try {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, marketplace_products!inner(title)), users!orders_farmer_id_fkey(name)')
      .eq('buyer_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer: Orders for my products
router.get('/my-sales', authorize('farmer'), async (req, res) => {
  try {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, marketplace_products!inner(title)), users!orders_buyer_id_fkey(name)')
      .eq('farmer_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer: Accept/reject order
router.put('/:id/status', authorize('farmer'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('farmer_id', req.user.id)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Order already processed' });

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    const { data: notif } = await supabase.from('notifications').insert({
      user_id: order.buyer_id,
      title: `Order ${status}`,
      message: `Order #${order.id.slice(0, 8)} has been ${status}`,
      type: 'order'
    }).select().single();

    const io = req.app.get('io');
    if (notif) io.to(`user:${order.buyer_id}`).emit('new-notification', notif);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buyer: Cancel order
router.post('/:id/cancel', authorize('buyer'), async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('buyer_id', req.user.id)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Cannot cancel processed order' });

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buyer: Complete order
router.put('/:id/complete', authorize('buyer'), async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('buyer_id', req.user.id)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'accepted') return res.status(400).json({ error: 'Order must be accepted first' });

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'completed', updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, marketplace_products!inner(title, price)), users!orders_buyer_id_fkey(name), users!orders_farmer_id_fkey(name)')
      .eq('id', req.params.id)
      .single();

    if (!data) return res.status(404).json({ error: 'Order not found' });
    if (data.buyer_id !== req.user.id && data.farmer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
