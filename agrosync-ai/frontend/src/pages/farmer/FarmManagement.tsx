import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sprout, Plus, MapPin, Trash2 } from 'lucide-react';
import { farms } from '../../services/api';

export default function FarmManagement() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ farm_name: '', location: '', latitude: '', longitude: '', soil_type: '', area: '', area_unit: 'hectares' });
  const queryClient = useQueryClient();

  const { data: farmList } = useQuery({ queryKey: ['farms'], queryFn: () => farms.getAll().then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => farms.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['farms'] }); setShowForm(false); setForm({ farm_name: '', location: '', latitude: '', longitude: '', soil_type: '', area: '', area_unit: 'hectares' }); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => farms.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farms'] })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    createMutation.mutate(fd);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Farm Management</h1>
          <p className="text-gray-500 mt-1">Register and manage your farms</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Farm
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 mb-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
              <input value={form.farm_name} onChange={e => setForm({ ...form, farm_name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
              <select value={form.soil_type} onChange={e => setForm({ ...form, soil_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="">Select</option>
                <option>Clay</option><option>Sandy</option><option>Loamy</option><option>Black</option><option>Red</option><option>Alluvial</option><option>Laterite</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <input type="number" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select value={form.area_unit} onChange={e => setForm({ ...form, area_unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option>hectares</option><option>acres</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Save Farm</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-6 py-2 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {farmList?.map((farm: any) => (
          <div key={farm.id} className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{farm.farm_name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {farm.location || 'No location set'}
                  </p>
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(farm.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-danger">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-3 text-sm text-gray-600">
              <span className="bg-gray-100 px-2 py-1 rounded">{farm.soil_type || 'N/A'} soil</span>
              <span className="bg-gray-100 px-2 py-1 rounded">{farm.area || 0} {farm.area_unit}</span>
            </div>
          </div>
        ))}
        {(!farmList || farmList.length === 0) && !showForm && (
          <div className="md:col-span-2 text-center py-12 text-gray-400">
            <Sprout className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No farms registered</p>
            <p className="text-sm mt-1">Click "Add Farm" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
