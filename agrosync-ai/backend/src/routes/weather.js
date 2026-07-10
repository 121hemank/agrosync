const express = require('express');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Get current weather for a farm
router.get('/current/:farmId', async (req, res) => {
  try {
    const { data: farm } = await supabase
      .from('farms')
      .select('latitude, longitude')
      .eq('id', req.params.farmId)
      .single();

    if (!farm) return res.status(404).json({ error: 'Farm not found' });

    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${farm.latitude}&lon=${farm.longitude}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    const weatherData = await response.json();

    res.json({
      temperature: weatherData.main?.temp ?? 0,
      feels_like: weatherData.main?.feels_like ?? 0,
      temp_min: weatherData.main?.temp_min ?? 0,
      temp_max: weatherData.main?.temp_max ?? 0,
      humidity: weatherData.main?.humidity ?? 0,
      pressure: weatherData.main?.pressure ?? 0,
      sea_level: weatherData.main?.sea_level ?? 0,
      wind_speed: weatherData.wind?.speed ?? 0,
      wind_deg: weatherData.wind?.deg ?? 0,
      wind_gust: weatherData.wind?.gust ?? 0,
      rainfall: weatherData.rain ? (weatherData.rain['1h'] ?? weatherData.rain['3h'] ?? 0) : 0,
      clouds: weatherData.clouds?.all ?? 0,
      visibility: weatherData.visibility ?? 0,
      description: weatherData.weather?.[0]?.description ?? '',
      icon: weatherData.weather?.[0]?.icon ?? '',
      sunrise: weatherData.sys?.sunrise ?? 0,
      sunset: weatherData.sys?.sunset ?? 0,
      city_name: weatherData.name || 'Unknown',
      country: weatherData.sys?.country || '',
      timezone: weatherData.timezone ?? 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get forecast for a farm
router.get('/forecast/:farmId', async (req, res) => {
  try {
    const { data: farm } = await supabase
      .from('farms')
      .select('latitude, longitude')
      .eq('id', req.params.farmId)
      .single();

    if (!farm) return res.status(404).json({ error: 'Farm not found' });

    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${farm.latitude}&lon=${farm.longitude}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    const forecastData = await response.json();

    const tzOffset = forecastData.city?.timezone ?? 0;

    const records = (forecastData.list || []).map(item => {
      const utcDate = new Date(item.dt_txt + ' UTC');
      const localDate = new Date(utcDate.getTime() + tzOffset * 1000);
      const localDt = localDate.toISOString().replace('T', ' ').slice(0, 19);

      return {
        farm_id: req.params.farmId,
        temperature: item.main.temp,
        feels_like: item.main.feels_like,
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        rainfall: item.rain ? item.rain['3h'] || 0 : 0,
        wind_speed: item.wind.speed,
        wind_deg: item.wind.deg,
        wind_gust: item.wind.gust,
        clouds: item.clouds?.all ?? 0,
        visibility: item.visibility ?? 0,
        pop: item.pop ?? 0,
        description: item.weather?.[0]?.description ?? '',
        icon: item.weather?.[0]?.icon ?? '',
        forecast_date: localDt
      };
    });

    if (records.length > 0) {
      await supabase.from('weather_history').upsert(records, {
        onConflict: ['farm_id', 'forecast_date'],
        ignoreDuplicates: true
      });
    }

    res.json(records.map(r => ({
      temperature: r.temperature,
      feels_like: r.feels_like,
      temp_min: r.temp_min,
      temp_max: r.temp_max,
      humidity: r.humidity,
      pressure: r.pressure,
      rainfall: r.rainfall,
      wind_speed: r.wind_speed,
      wind_deg: r.wind_deg,
      wind_gust: r.wind_gust,
      clouds: r.clouds,
      visibility: r.visibility,
      pop: r.pop,
      description: r.description,
      icon: r.icon,
      forecast_date: r.forecast_date
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical weather for a farm
router.get('/history/:farmId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('weather_history')
      .select('*')
      .eq('farm_id', req.params.farmId)
      .order('forecast_date', { ascending: false })
      .limit(30);

    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
