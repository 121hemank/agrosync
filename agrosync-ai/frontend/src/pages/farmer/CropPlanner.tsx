import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sprout, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ThumbsUp, ThumbsDown, ShoppingBag } from 'lucide-react';
import { farms, cropsAPI } from '../../services/api';

export default function CropPlanner() {
  const [farmId, setFarmId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ crop_id: '', planted_date: '', area_used: '' });
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: farmList } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farms.getAll().then(r => r.data)
  });

  const { data: cropsList } = useQuery({
    queryKey: ['crops'],
    queryFn: () => cropsAPI.getAll().then(r => r.data)
  });

  const { data: userCrops } = useQuery({
    queryKey: ['user-crops', farmId],
    queryFn: () => farms.getCrops(farmId).then(r => r.data),
    enabled: !!farmId
  });

  const plantMutation = useMutation({
    mutationFn: (data: any) => farms.plantCrop(farmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-crops', farmId] });
      setShowForm(false);
      setForm({ crop_id: '', planted_date: '', area_used: '' });
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message || 'Failed to plant crop');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ cropId, status }: { cropId: string; status: string }) =>
      farms.updateCropStatus(farmId, cropId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-crops', farmId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    plantMutation.mutate(form);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'growing': return <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Growing</span>;
      case 'harvested': return <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Harvested</span>;
      case 'failed': return <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Failed</span>;
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Crop Planner</h1>
          <p className="text-gray-500 mt-1">Plan and manage your crops</p>
        </div>
        {farmId && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            <Sprout className="w-4 h-4" /> Plant Crop
          </button>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Farm</label>
        <select
          value={farmId}
          onChange={e => { setFarmId(e.target.value); setShowForm(false); }}
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
          <Sprout className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Select a farm to manage crops</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 mb-6 space-y-4">
          <h3 className="font-heading font-semibold">Plant New Crop</h3>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
              <select value={form.crop_id} onChange={e => setForm({ ...form, crop_id: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="">Select a crop</option>
                {cropsList?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.crop_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planted Date</label>
              <input type="date" value={form.planted_date} onChange={e => setForm({ ...form, planted_date: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area Used (hectares)</label>
              <input type="number" step="0.01" value={form.area_used} onChange={e => setForm({ ...form, area_used: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={plantMutation.isPending} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {plantMutation.isPending ? 'Planting...' : 'Plant Crop'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      {farmId && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-heading font-semibold">Planted Crops</h2>
          </div>
          {!userCrops || userCrops.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No crops planted yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {userCrops.map((crop: any) => (
                <div key={crop.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{crop.crops?.crop_name || crop.crop_id}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> Planted {new Date(crop.planted_date).toLocaleDateString()}
                        {crop.area_used && <> · {crop.area_used} hectares</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {crop.status === 'growing' && (
                      <>
                        <button onClick={() => statusMutation.mutate({ cropId: crop.id, status: 'harvested' })}
                          className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200">
                          <ThumbsUp className="w-3 h-3" /> Harvested
                        </button>
                        <button onClick={() => statusMutation.mutate({ cropId: crop.id, status: 'failed' })}
                          className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full hover:bg-red-200">
                          <ThumbsDown className="w-3 h-3" /> Failed
                        </button>
                      </>
                    )}
                    {crop.status === 'harvested' && (
                      <button onClick={() => navigate(`/farmer/marketplace?cropName=${encodeURIComponent(crop.crops?.crop_name || crop.crop_id)}&farmId=${farmId}&cropId=${crop.crop_id}&area=${crop.area_used || ''}`)}
                        className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1.5 rounded-full hover:bg-primary-700">
                        <ShoppingBag className="w-3 h-3" /> List in Marketplace
                      </button>
                    )}
                    {statusBadge(crop.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
