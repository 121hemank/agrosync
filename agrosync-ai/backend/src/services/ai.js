const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function getCropRecommendation(data) {
  const res = await fetch(`${AI_SERVICE_URL}/api/recommend-crop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('AI service error');
  return res.json();
}

async function predictHarvest(data) {
  const res = await fetch(`${AI_SERVICE_URL}/api/predict-harvest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('AI service error');
  return res.json();
}

async function predictYield(data) {
  const res = await fetch(`${AI_SERVICE_URL}/api/predict-yield`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('AI service error');
  return res.json();
}

module.exports = { getCropRecommendation, predictHarvest, predictYield };
