const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all expenses for user
router.get('/', async (req, res) => {
  try {
    const { farm_id, category, start_date, end_date } = req.query;
    let query = supabase
      .from('farm_expenses')
      .select('*, crops(crop_name)')
      .eq('user_id', req.user.id)
      .order('expense_date', { ascending: false });

    if (farm_id) query = query.eq('farm_id', farm_id);
    if (category) query = query.eq('expense_category', category);
    if (start_date) query = query.gte('expense_date', start_date);
    if (end_date) query = query.lte('expense_date', end_date);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense summary by category
router.get('/summary/by-category', async (req, res) => {
  try {
    const { farm_id, year } = req.query;
    let query = supabase
      .from('farm_expenses')
      .select('expense_category, amount, expense_date')
      .eq('user_id', req.user.id);

    if (farm_id) query = query.eq('farm_id', farm_id);
    if (year) {
      query = query.gte('expense_date', `${year}-01-01`).lte('expense_date', `${year}-12-31`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const summary = (data || []).reduce((acc, exp) => {
      if (!acc[exp.expense_category]) acc[exp.expense_category] = { total: 0, count: 0 };
      acc[exp.expense_category].total += parseFloat(exp.amount);
      acc[exp.expense_category].count++;
      return acc;
    }, {});

    const totalExpenses = Object.values(summary).reduce((sum, cat) => sum + cat.total, 0);

    res.json({ categories: summary, totalExpenses, totalTransactions: data?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly expense trend
router.get('/summary/monthly', async (req, res) => {
  try {
    const { farm_id, year } = req.query;
    const targetYear = year || new Date().getFullYear();

    let query = supabase
      .from('farm_expenses')
      .select('amount, expense_date')
      .eq('user_id', req.user.id)
      .gte('expense_date', `${targetYear}-01-01`)
      .lte('expense_date', `${targetYear}-12-31`);

    if (farm_id) query = query.eq('farm_id', farm_id);

    const { data, error } = await query;
    if (error) throw error;

    const monthly = Array(12).fill(0);
    (data || []).forEach(exp => {
      const month = new Date(exp.expense_date).getMonth();
      monthly[month] += parseFloat(exp.amount);
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    res.json(months.map((name, i) => ({ name, total: monthly[i] })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profitability report (revenue vs expenses)
router.get('/summary/profitability', async (req, res) => {
  try {
    const { farm_id, year } = req.query;
    const targetYear = year || new Date().getFullYear();

    let expenseQuery = supabase
      .from('farm_expenses')
      .select('amount, expense_date, expense_category')
      .eq('user_id', req.user.id)
      .gte('expense_date', `${targetYear}-01-01`)
      .lte('expense_date', `${targetYear}-12-31`);

    if (farm_id) expenseQuery = expenseQuery.eq('farm_id', farm_id);

    const { data: expenses, error: expError } = await expenseQuery;
    if (expError) throw expError;

    let revenueQuery = supabase
      .from('orders')
      .select('total, created_at')
      .eq('farmer_id', req.user.id)
      .eq('status', 'completed')
      .gte('created_at', `${targetYear}-01-01`)
      .lte('created_at', `${targetYear}-12-31`);

    const { data: revenues, error: revError } = await revenueQuery;
    if (revError) throw revError;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyExpenses = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);

    (expenses || []).forEach(exp => {
      const month = new Date(exp.expense_date).getMonth();
      monthlyExpenses[month] += parseFloat(exp.amount);
    });

    (revenues || []).forEach(rev => {
      const month = new Date(rev.created_at).getMonth();
      monthlyRevenue[month] += parseFloat(rev.total);
    });

    const totalExpenses = monthlyExpenses.reduce((a, b) => a + b, 0);
    const totalRevenue = monthlyRevenue.reduce((a, b) => a + b, 0);

    res.json({
      months: months.map((name, i) => ({
        name,
        revenue: monthlyRevenue[i],
        expenses: monthlyExpenses[i],
        profit: monthlyRevenue[i] - monthlyExpenses[i]
      })),
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense by id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('farm_expenses')
      .select('*, crops(crop_name)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Expense not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', async (req, res) => {
  try {
    const { farm_id, expense_category, description, amount, expense_date, crop_id, quantity, unit } = req.body;

    const { data, error } = await supabase.from('farm_expenses').insert({
      farm_id,
      user_id: req.user.id,
      expense_category,
      description,
      amount,
      expense_date,
      crop_id: crop_id || null,
      quantity: quantity || null,
      unit: unit || null
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { farm_id, expense_category, description, amount, expense_date, crop_id, quantity, unit } = req.body;
    const { data, error } = await supabase
      .from('farm_expenses')
      .update({ farm_id, expense_category, description, amount, expense_date, crop_id: crop_id || null, quantity: quantity || null, unit: unit || null })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Expense not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('farm_expenses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
