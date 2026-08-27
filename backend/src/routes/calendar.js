const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Get all calendar events for user
router.get('/', async (req, res) => {
  try {
    const { farm_id, month, year } = req.query;
    let query = supabase
      .from('crop_calendar_events')
      .select('*')
      .eq('user_id', req.user.id)
      .order('event_date', { ascending: true });

    if (farm_id) query = query.eq('farm_id', farm_id);
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).getDate();
      const end = `${year}-${String(month).padStart(2, '0')}-${endDate}`;
      query = query.gte('event_date', start).lte('event_date', end);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming events (next 30 days)
router.get('/upcoming', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('crop_calendar_events')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('event_date', today)
      .lte('event_date', futureDate)
      .order('event_date', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weather alerts for user
router.get('/alerts/weather', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('weather_alerts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark weather alert as read
router.patch('/alerts/:alertId/read', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('weather_alerts')
      .update({ is_read: true })
      .eq('id', req.params.alertId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Alert not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate weather-based alerts for a farm
router.post('/alerts/generate', async (req, res) => {
  try {
    const { farm_id } = req.body;
    if (!farm_id) return res.status(400).json({ error: 'farm_id required' });

    const { data: farm } = await supabase
      .from('farms')
      .select('latitude, longitude, farm_name')
      .eq('id', farm_id)
      .single();

    if (!farm) return res.status(404).json({ error: 'Farm not found' });
    if (!farm.latitude || !farm.longitude) return res.status(400).json({ error: 'Farm latitude and longitude are required for weather alerts' });

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OpenWeather API key not configured' });

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${farm.latitude}&lon=${farm.longitude}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const forecastData = await response.json();

    if (forecastData.cod && forecastData.cod !== '200') {
      return res.status(500).json({ error: `Weather API error: ${forecastData.message}` });
    }

    const alerts = [];

    (forecastData.list || []).forEach(item => {
      const temp = item.main.temp;
      const humidity = item.main.humidity;
      const rain = item.rain ? (item.rain['3h'] || 0) : 0;
      const wind = item.wind?.speed || 0;

      if (temp < 2) {
        alerts.push({
          farm_id,
          user_id: req.user.id,
          alert_type: 'frost',
          severity: temp < 0 ? 'critical' : 'high',
          title: `Frost Warning for ${farm.farm_name}`,
          message: `Temperature expected to drop to ${temp.toFixed(1)}°C. Protect sensitive crops from frost damage.`,
          temperature: temp,
          humidity,
          rainfall_mm: rain,
          wind_speed: wind
        });
      } else if (temp > 40) {
        alerts.push({
          farm_id,
          user_id: req.user.id,
          alert_type: 'heatwave',
          severity: temp > 45 ? 'critical' : 'high',
          title: `Heatwave Alert for ${farm.farm_name}`,
          message: `Temperature expected to reach ${temp.toFixed(1)}°C. Ensure adequate irrigation and shade for crops.`,
          temperature: temp,
          humidity,
          rainfall_mm: rain,
          wind_speed: wind
        });
      } else if (rain > 50) {
        alerts.push({
          farm_id,
          user_id: req.user.id,
          alert_type: 'heavy_rain',
          severity: rain > 100 ? 'critical' : 'high',
          title: `Heavy Rain Alert for ${farm.farm_name}`,
          message: `${rain.toFixed(1)}mm rainfall expected. Prepare drainage and protect standing crops.`,
          temperature: temp,
          humidity,
          rainfall_mm: rain,
          wind_speed: wind
        });
      } else if (wind > 15) {
        alerts.push({
          farm_id,
          user_id: req.user.id,
          alert_type: 'storm',
          severity: wind > 25 ? 'critical' : 'moderate',
          title: `Storm Warning for ${farm.farm_name}`,
          message: `Strong winds of ${wind.toFixed(1)} m/s expected. Secure farm equipment and structures.`,
          temperature: temp,
          humidity,
          rainfall_mm: rain,
          wind_speed: wind
        });
      }
    });

    if (alerts.length > 0) {
      const uniqueAlerts = alerts.filter((alert, index, self) =>
        index === self.findIndex(a => a.alert_type === alert.alert_type)
      );
      const { data } = await supabase.from('weather_alerts').insert(uniqueAlerts).select();
      res.json({ alerts: data, count: data.length });
    } else {
      res.json({ alerts: [], count: 0, message: 'No severe weather conditions detected for the next 5 days' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get calendar event by id (must be after /alerts/* routes)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('crop_calendar_events')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Event not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create calendar event
router.post('/', async (req, res) => {
  try {
    const { farm_id, crop_name, event_type, event_date, end_date, notes, priority } = req.body;

    const { data, error } = await supabase.from('crop_calendar_events').insert({
      farm_id,
      user_id: req.user.id,
      crop_name,
      event_type,
      event_date,
      end_date,
      notes,
      priority: priority || 'medium'
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update calendar event
router.put('/:id', async (req, res) => {
  try {
    const { crop_name, event_type, event_date, end_date, notes, priority, status, weather_alert, alert_message } = req.body;
    const updates = {};
    if (crop_name !== undefined) updates.crop_name = crop_name;
    if (event_type !== undefined) updates.event_type = event_type;
    if (event_date !== undefined) updates.event_date = event_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (notes !== undefined) updates.notes = notes;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (weather_alert !== undefined) updates.weather_alert = weather_alert;
    if (alert_message !== undefined) updates.alert_message = alert_message;

    const { data, error } = await supabase
      .from('crop_calendar_events')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Event not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete calendar event
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('crop_calendar_events')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark event as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('crop_calendar_events')
      .update({ status: 'completed' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Event not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
