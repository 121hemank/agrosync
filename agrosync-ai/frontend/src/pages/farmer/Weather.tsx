import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CloudSun, CloudRain, Droplets, Wind, Thermometer, Eye, Gauge, Sunrise, Sunset, Cloud } from 'lucide-react';
import { farms, weather } from '../../services/api';

function formatTime(unixTs: number, tzOffset: number) {
  return new Date((unixTs + tzOffset) * 1000).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
}

export default function Weather() {
  const [farmId, setFarmId] = useState('');

  const { data: farmList } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farms.getAll().then(r => r.data)
  });

  const { data: current, isLoading: loadingCurrent } = useQuery({
    queryKey: ['weather-current', farmId],
    queryFn: () => weather.current(farmId).then(r => r.data),
    enabled: !!farmId,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000
  });

  const { data: forecast, isLoading: loadingForecast } = useQuery({
    queryKey: ['weather-forecast', farmId],
    queryFn: () => weather.forecast(farmId).then(r => r.data),
    enabled: !!farmId,
    refetchInterval: 30 * 60 * 1000,
    staleTime: 5 * 60 * 1000
  });

  const tzOffset = current?.timezone ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Weather Dashboard</h1>
        <p className="text-gray-500 mt-1">Current weather and forecast for your farm</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Farm</label>
        <select
          value={farmId}
          onChange={e => setFarmId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">Choose a farm</option>
          {farmList?.map((f: any) => (
            <option key={f.id} value={f.id}>{f.farm_name}</option>
          ))}
        </select>
      </div>

      {!farmId && (
        <div className="text-center py-12 text-gray-400">
          <CloudSun className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Select a farm to view weather</p>
        </div>
      )}

      {farmId && (loadingCurrent || loadingForecast) && (
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Loading weather data...</p>
        </div>
      )}

      {farmId && current && (
        <>
          <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-primary" /> Current Weather
              <span className="text-sm font-normal text-gray-400 ml-2">— {current.city_name}{current.country ? `, ${current.country}` : ''}</span>
              {current.description && <span className="text-sm font-normal text-gray-400 capitalize">({current.description})</span>}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Thermometer className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Temperature</p>
                  <p className="text-xl font-bold">{current.temperature}°C</p>
                  <p className="text-xs text-gray-400">Feels like {current.feels_like}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Droplets className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Humidity</p>
                  <p className="text-xl font-bold">{current.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                <CloudRain className="w-8 h-8 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-500">Rainfall</p>
                  <p className="text-xl font-bold">{current.rainfall} mm</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-lg">
                <Wind className="w-8 h-8 text-cyan-500" />
                <div>
                  <p className="text-sm text-gray-500">Wind</p>
                  <p className="text-xl font-bold">{current.wind_speed} km/h</p>
                  <p className="text-xs text-gray-400">Gust {current.wind_gust} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <Gauge className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Pressure</p>
                  <p className="text-xl font-bold">{current.pressure} hPa</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                <Eye className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">Visibility</p>
                  <p className="text-xl font-bold">{(current.visibility / 1000).toFixed(1)} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Cloud className="w-8 h-8 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Cloud Cover</p>
                  <p className="text-xl font-bold">{current.clouds}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <Sunrise className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Sunrise</p>
                  <p className="text-xl font-bold">{formatTime(current.sunrise, tzOffset)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg">
                <Sunset className="w-8 h-8 text-pink-500" />
                <div>
                  <p className="text-sm text-gray-500">Sunset</p>
                  <p className="text-xl font-bold">{formatTime(current.sunset, tzOffset)}</p>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      {farmId && forecast && forecast.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">5-Day Forecast (3-Hour Intervals)</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
              {forecast.map((entry: any, i: number) => (
                <div key={i} className="flex-shrink-0 w-32 p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs font-medium text-gray-600">
                    {new Date(entry.forecast_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mb-1">
                    {entry.forecast_date?.split(' ')[1]?.slice(0, 5)}
                  </p>
                  <p className="text-sm font-bold mt-1">{entry.temperature}°C</p>
                  <p className="text-xs text-gray-400 capitalize">{entry.description}</p>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <p><Droplets className="w-3 h-3 inline mr-1" />{entry.humidity}%</p>
                    <p><CloudRain className="w-3 h-3 inline mr-1" />{entry.rainfall} mm</p>
                    <p><Wind className="w-3 h-3 inline mr-1" />{entry.wind_speed} km/h</p>
                    <p className="text-gray-400">Pop: {Math.round(entry.pop * 100)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
