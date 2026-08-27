import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Calendar as CalIcon, CheckCircle2, XCircle, Clock, AlertCircle,
  ThumbsUp, ThumbsDown, ShoppingBag, Plus, Droplets, Bug, Scissors,
  Tractor, CheckCircle, X, Pencil
} from 'lucide-react';
import { farms, cropsAPI, calendar, marketplace } from '../../services/api';

const EVENT_TYPES = [
  { value: 'planting', label: 'Planting', icon: Sprout, color: 'bg-green-100 text-green-700' },
  { value: 'fertilizing', label: 'Fertilizing', icon: Tractor, color: 'bg-blue-100 text-blue-700' },
  { value: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'pest_control', label: 'Pest Control', icon: Bug, color: 'bg-red-100 text-red-700' },
  { value: 'harvesting', label: 'Harvesting', icon: Scissors, color: 'bg-amber-100 text-amber-700' },
  { value: 'other', label: 'Other', icon: CalIcon, color: 'bg-gray-100 text-gray-700' }
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CropPlanner() {
  const [activeTab, setActiveTab] = useState<'crops' | 'calendar'>('crops');
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

  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => marketplace.getMyListings().then(r => r.data)
  });

  const isCropListed = (cropId: string) => {
    return myListings?.some((p: any) =>
      p.crop_id === cropId &&
      p.farm_id === farmId &&
      p.status !== 'archived'
    );
  };

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
          <p className="text-gray-500 mt-1">Plan, schedule, and manage your crops</p>
        </div>
        {activeTab === 'crops' && farmId && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            <Sprout className="w-4 h-4" /> Plant Crop
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('crops')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'crops' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
          <Sprout className="w-4 h-4" /> My Crops
        </button>
        <button onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
          <CalIcon className="w-4 h-4" /> Calendar
        </button>
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

      {farmId && activeTab === 'crops' && (
        <CropsTab
          farmId={farmId}
          userCrops={userCrops}
          showForm={showForm}
          setShowForm={setShowForm}
          form={form}
          setForm={setForm}
          error={error}
          cropsList={cropsList}
          handleSubmit={handleSubmit}
          plantMutation={plantMutation}
          statusMutation={statusMutation}
          statusBadge={statusBadge}
          navigate={navigate}
          isCropListed={isCropListed}
        />
      )}

      {farmId && activeTab === 'calendar' && (
        <CalendarTab farmId={farmId} />
      )}
    </div>
  );
}

function CropsTab({ farmId, userCrops, showForm, setShowForm, form, setForm, error, cropsList, handleSubmit, plantMutation, statusMutation, statusBadge, navigate, isCropListed }: any) {
  return (
    <>
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
                      <CalIcon className="w-3 h-3" /> Planted {new Date(crop.planted_date).toLocaleDateString()}
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
                    isCropListed(crop.crop_id) ? (
                      <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full cursor-not-allowed" title="Already listed in marketplace">
                        <ShoppingBag className="w-3 h-3" /> Listed in Market
                      </span>
                    ) : (
                      <button onClick={() => navigate(`/farmer/marketplace?cropName=${encodeURIComponent(crop.crops?.crop_name || crop.crop_id)}&farmId=${farmId}&cropId=${crop.crop_id}&area=${crop.area_used || ''}`)}
                        className="flex items-center gap-1 text-xs bg-primary text-white px-3 py-1.5 rounded-full hover:bg-primary-700">
                        <ShoppingBag className="w-3 h-3" /> List in Marketplace
                      </button>
                    )
                  )}
                  {statusBadge(crop.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CalendarTab({ farmId }: { farmId: string }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [form, setForm] = useState({
    crop_name: '', event_type: 'planting', event_date: '', end_date: '', notes: '', priority: 'medium', farm_id: ''
  });
  const queryClient = useQueryClient();

  const FARM_COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', range: 'bg-blue-50 border-blue-200' },
    { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', range: 'bg-purple-50 border-purple-200' },
    { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', range: 'bg-amber-50 border-amber-200' },
    { bg: 'bg-pink-100', text: 'text-pink-700', dot: 'bg-pink-500', range: 'bg-pink-50 border-pink-200' },
    { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500', range: 'bg-teal-50 border-teal-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500', range: 'bg-indigo-50 border-indigo-200' },
  ];

  const { data: allFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farms.getAll().then(r => r.data)
  });

  const farmColorMap: Record<string, typeof FARM_COLORS[0]> = {};
  (allFarms || []).forEach((f: any, i: number) => {
    farmColorMap[f.id] = FARM_COLORS[i % FARM_COLORS.length];
  });

  const { data: events } = useQuery({
    queryKey: ['calendar-events', farmId, selectedMonth, selectedYear],
    queryFn: () => calendar.getAll({ farm_id: farmId, month: selectedMonth, year: selectedYear }).then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => calendar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowForm(false);
      setForm({ crop_name: '', event_type: 'planting', event_date: '', end_date: '', notes: '', priority: 'medium', farm_id: '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => calendar.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setEditEvent(null);
      setForm({ crop_name: '', event_type: 'planting', event_date: '', end_date: '', notes: '', priority: 'medium', farm_id: '' });
    }
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => calendar.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendar.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editEvent) {
      updateMutation.mutate({ id: editEvent.id, data: { ...form, farm_id: farmId } });
    } else {
      createMutation.mutate({ ...form, farm_id: farmId });
    }
  };

  const openEditForm = (event: any) => {
    setForm({
      crop_name: event.crop_name,
      event_type: event.event_type,
      event_date: event.event_date,
      end_date: event.end_date || '',
      notes: event.notes || '',
      priority: event.priority || 'medium',
      farm_id: event.farm_id || farmId
    });
    setEditEvent(event);
    setShowForm(true);
  };

  const openNewForm = () => {
    setForm({ crop_name: '', event_type: 'planting', event_date: '', end_date: '', notes: '', priority: 'medium', farm_id: '' });
    setEditEvent(null);
    setShowForm(true);
  };

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  const isInRange = (day: number, ev: any) => {
    if (!ev.end_date) return false;
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr >= ev.event_date && dateStr <= ev.end_date && dateStr !== ev.event_date;
  };

  const isStartDay = (day: number, ev: any) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ev.event_date === dateStr;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return (events || []).filter((e: any) => {
      if (e.status !== 'pending') return false;
      if (e.event_date === dateStr) return true;
      if (e.end_date && dateStr > e.event_date && dateStr <= e.end_date) return true;
      return false;
    });
  };

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <button onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h2 className="font-heading font-semibold text-lg mb-4">{editEvent ? 'Edit Event' : 'Add Calendar Event'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name</label>
                <input type="text" value={form.crop_name} onChange={e => setForm({ ...form, crop_name: e.target.value })} required
                  placeholder="e.g. Rice, Wheat" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {editEvent ? (updateMutation.isPending ? 'Saving...' : 'Save Changes') : (createMutation.isPending ? 'Adding...' : 'Add Event')}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditEvent(null); }} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {(allFarms || []).length > 1 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {(allFarms || []).map((f: any) => {
            const fc = farmColorMap[f.id] || FARM_COLORS[0];
            return (
              <div key={f.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`w-3 h-3 rounded-full ${fc.dot}`} />
                {f.farm_name}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">{MONTHS[selectedMonth - 1]} {selectedYear}</h2>
            <div className="flex gap-1">
              <button onClick={() => setSelectedMonth(selectedMonth === 1 ? 12 : selectedMonth - 1)}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Prev</button>
              <button onClick={() => setSelectedMonth(selectedMonth === 12 ? 1 : selectedMonth + 1)}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Next</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() + 1 === selectedMonth && new Date().getFullYear() === selectedYear;
              return (
                <div key={day} className={`min-h-[64px] p-1 border rounded text-xs ${isToday ? 'border-primary bg-green-50' : 'border-gray-100'}`}>
                  <span className={`font-medium ${isToday ? 'text-primary' : 'text-gray-700'}`}>{day}</span>
                  <div className="space-y-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((ev: any) => {
                      const typeInfo = EVENT_TYPES.find(t => t.value === ev.event_type) || EVENT_TYPES[5];
                      const fc = farmColorMap[ev.farm_id] || FARM_COLORS[0];
                      const start = isStartDay(day, ev);
                      const inRange = isInRange(day, ev);
                      if (inRange) {
                        return (
                          <div key={ev.id} className={`px-1 py-0.5 rounded text-[10px] truncate ${fc.range} border ${fc.text} border-dashed`}>
                            {ev.crop_name}
                          </div>
                        );
                      }
                      return (
                        <div key={ev.id} className={`px-1 py-0.5 rounded text-[10px] truncate ${typeInfo.color} ${ev.end_date ? 'border-l-2 ' + fc.text : ''}`}>
                          {start ? ev.crop_name : ev.crop_name}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && <div className="text-[10px] text-gray-400">+{dayEvents.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {(events || []).filter((e: any) => e.status === 'pending').slice(0, 10).map((event: any) => {
              const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type) || EVENT_TYPES[5];
              const Icon = typeInfo.icon;
              const fc = farmColorMap[event.farm_id] || FARM_COLORS[0];
              return (
                <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.crop_name}</p>
                        <p className="text-xs text-gray-500">{typeInfo.label} · {event.event_date}{event.end_date ? ` → ${event.end_date}` : ''}</p>
                        {(allFarms || []).length > 1 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`w-2 h-2 rounded-full ${fc.dot}`} />
                            <span className="text-[10px] text-gray-400">{(allFarms || []).find((f: any) => f.id === event.farm_id)?.farm_name || 'Farm'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditForm(event)} title="Edit"
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => completeMutation.mutate(event.id)} title="Mark complete"
                        className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete this event?')) deleteMutation.mutate(event.id); }} title="Delete"
                        className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
            {(!events || events.filter((e: any) => e.status === 'pending').length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No upcoming events</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
