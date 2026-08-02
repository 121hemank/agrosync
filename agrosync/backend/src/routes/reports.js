const express = require('express');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

function renderTable(doc, headers, rows) {
  const margin = 40;
  const pageWidth = doc.page.width - margin * 2;
  const pad = 7;
  const fs = 9;

  const clean = (v) => (v === null || v === undefined ? '' : String(v));

  const colWidths = headers.map(h => {
    let w = doc.widthOfString(h, { font: 'Helvetica-Bold', size: fs }) + pad * 2;
    for (const row of rows) {
      const cw = doc.widthOfString(clean(row[h]), { font: 'Helvetica', size: fs }) + pad * 2;
      if (cw > w) w = cw;
    }
    return Math.min(w + 4, 200);
  });

  let total = colWidths.reduce((a, b) => a + b, 0);
  if (total > pageWidth) {
    const scale = pageWidth / total;
    colWidths.forEach((w, i) => { colWidths[i] = w * scale; });
  }

  const drawRow = (cells, isHeader) => {
    const rowY = doc.y;
    const heights = cells.map((c, i) => doc.heightOfString(c, { width: colWidths[i] - pad * 2 }));
    let rowHeight = Math.max(...heights) + pad * 2;
    rowHeight = Math.max(rowHeight, 20);

    if (rowY + rowHeight > doc.page.height - margin && rowHeight < doc.page.height - margin * 2) {
      doc.addPage();
      doc.y = margin;
      if (!isHeader) drawHeader();
      drawRow(cells, isHeader);
      return;
    }

    if (isHeader) {
      doc.fillColor('#d1fae5').rect(margin, rowY, pageWidth, rowHeight).fill();
    }
    doc.fillColor('#111827');

    let x = margin;
    cells.forEach((c, i) => {
      doc.rect(x, rowY, colWidths[i], rowHeight).strokeColor('#d1d5db').lineWidth(0.5).stroke();
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(fs);
      doc.text(c, x + pad, rowY + pad, { width: colWidths[i] - pad * 2 });
      x += colWidths[i];
    });
    doc.y = rowY + rowHeight;
  };

  const drawHeader = () => drawRow(headers, true);

  drawHeader();
  rows.forEach(row => drawRow(headers.map(h => clean(row[h])), false));
}

// Generate PDF report
router.post('/pdf', async (req, res) => {
  try {
    const { type, data } = req.body;
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=agrosync-report-${Date.now()}.pdf`);
    doc.pipe(res);

    const title = type || 'Report';
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#15803d').text('AgroSync AI', { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#4b5563').text('Agriculture Intelligence Platform', { align: 'center' });
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#d1d5db').lineWidth(1).stroke();
    doc.moveDown();
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#111827').text(`${title} Report`);
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text(`Generated on ${date}`);
    doc.moveDown(0.5);

    const rows = Array.isArray(data) ? data : [];
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      renderTable(doc, headers, rows);
    } else {
      doc.font('Helvetica').fontSize(11).fillColor('#9ca3af').text('No data available for this report.');
    }

    doc.end();

    supabase.from('reports').insert({
      user_id: req.user.id,
      report_name: `${title} Report`,
      report_type: 'pdf'
    }).then(() => {}).catch(() => {});
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
