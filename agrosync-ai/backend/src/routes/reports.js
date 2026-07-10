const express = require('express');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Generate PDF report
router.post('/pdf', async (req, res) => {
  try {
    const { type, data } = req.body;
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=agrosync-report-${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('AgroSync AI', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Agriculture Intelligence Platform', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).font('Helvetica-Bold').text(`${type} Report`);
    doc.moveDown();

    if (data && Array.isArray(data)) {
      const headers = Object.keys(data[0] || {});
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, 30 + i * 80, doc.y, { width: 75, align: 'left' });
      });
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(9);
      for (const row of data) {
        const y = doc.y;
        headers.forEach((h, i) => {
          doc.text(String(row[h] || ''), 30 + i * 80, y, { width: 75, align: 'left' });
        });
        doc.moveDown(0.3);
        if (doc.y > 750) { doc.addPage(); }
      }
    }

    doc.end();

    await supabase.from('reports').insert({
      user_id: req.user.id,
      report_name: `${type} Report`,
      report_type: 'pdf'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate CSV
router.post('/csv', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=agrosync-export-${Date.now()}.csv`);
    res.send(csv);

    await supabase.from('reports').insert({
      user_id: req.user.id,
      report_name: 'Data Export',
      report_type: 'csv'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's reports
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
