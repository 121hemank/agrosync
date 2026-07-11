import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, Star, TrendingUp } from 'lucide-react';
import { farms, ai } from '../../services/api';

export default function AIRecommendations() {
  const [farmId, setFarmId] = useState('');
  const [form, setForm] = useState({ nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: farmList } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farms.getAll().then(r => r.data)
  });

  const { data: history } = useQuery({
    queryKey: ['ai-recommendations', farmId],
    queryFn: () => ai.getRecommendations(farmId).then(r => r.data),
    enabled: !!farmId
  });

  const recommendMutation = useMutation({
    mutationFn: (data: any) => ai.recommendCrop(data),
    onSuccess: (res) => {
      setResult(res.data);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations', farmId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Request failed';
      setError(msg);
      setResult(null);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recommendMutation.mutate({
      ...form,
      nitrogen: parseFloat(form.nitrogen),
      phosphorus: parseFloat(form.phosphorus),
      potassium: parseFloat(form.potassium),
      temperature: parseFloat(form.temperature),
      humidity: parseFloat(form.humidity),
      ph: parseFloat(form.ph),
      rainfall: parseFloat(form.rainfall),
      farm_id: farmId || undefined
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">AI Crop Recommendations</h1>
        <p className="text-gray-500 mt-1">Get AI-powered crop suggestions based on your soil and climate</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Input Parameters
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
              <select value={farmId} onChange={e => setFarmId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="">Optional - select farm</option>
                {farmList?.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.farm_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nitrogen (N)</label>
                <input type="number" step="0.1" min="0" max="200" value={form.nitrogen} onChange={e => setForm({ ...form, nitrogen: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                <p className="text-xs text-gray-400 mt-1">Soil nitrogen content (0-200 kg/ha)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phosphorus (P)</label>
                <input type="number" step="0.1" min="0" max="200" value={form.phosphorus} onChange={e => setForm({ ...form, phosphorus: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                <p className="text-xs text-gray-400 mt-1">Soil phosphorus content (0-200 kg/ha)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Potassium (K)</label>
                <input type="number" step="0.1" min="0" max="200" value={form.potassium} onChange={e => setForm({ ...form, potassium: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                <p className="text-xs text-gray-400 mt-1">Soil potassium content (0-200 kg/ha)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (C)</label>
                <input type="number" step="0.1" min="-20" max="80" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                <p className="text-xs text-gray-400 mt-1">Average temperature (-20 to 80 C)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Humidity (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={form.humidity} onChange={e => setForm({ ...form, humidity: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                <p className="text-xs text-gray-400 mt-1">Relative humidity (0-100%)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soil pH</label>
                <input type="number" step="0.1" min="0" max="14" value={form.ph} onChange={e => setForm({ ...form, ph: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                <p className="text-xs text-gray-400 mt-1">Soil pH level (0-14)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rainfall (mm)</label>
                <input type="number" step="0.1" min="0" max="1000" value={form.rainfall} onChange={e => setForm({ ...form, rainfall: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                <p className="text-xs text-gray-400 mt-1">Average rainfall (0-1000 mm)</p>
              </div>
            </div>
            <button type="submit" disabled={recommendMutation.isPending}
              className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {recommendMutation.isPending ? 'Analyzing...' : 'Get Recommendation'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <p className="text-sm text-red-700 font-medium">Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}
          {result && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Recommendation
              </h2>
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <SproutIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-heading">{result.recommended_crop}</h3>
                <div className="flex justify-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    <TrendingUp className="w-4 h-4" /> {result.confidence.toFixed(0)}% confidence
                  </span>
                  {result.suitability_score != null && (
                    <span className="flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4" /> Suitability: {result.suitability_score.toFixed(1)}
                    </span>
                  )}
                </div>
                {result.reason && (
                  <p className="mt-4 text-sm text-gray-600">{result.reason}</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> Recommendation History
            </h2>
            {!history || history.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recommendations yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((rec: any) => (
                  <div key={rec.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{rec.recommended_crop}</p>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{rec.confidence.toFixed(0)}%</span>
                    </div>
                    {rec.reason && <p className="text-sm text-gray-500 mt-1">{rec.reason.split('. ')[0]}.</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SproutIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V8" /><path d="M12 8c-3 0-5-2-5-5" /><path d="M12 8c3 0 5-2 5-5" /><path d="M2 13h20" />
    </svg>
  );
}
