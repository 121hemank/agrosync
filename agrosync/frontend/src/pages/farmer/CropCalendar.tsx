import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalIcon, Plus, Sprout, Droplets, Bug, Scissors, Tractor, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { calendar, farms } from '../../services/api';

const EVENT_TYPES = [
  { value: 'planting', label: 'Planting', icon: Sprout, color: 'bg-green-100 text-green-700' },
  { value: 'fertilizing', label: 'Fertilizing', icon: Tractor, color: 'bg-blue-100 text-blue-700' },
  { value: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'pest_control', label: 'Pest Control', icon: Bug, color: 'bg-red-100 text-red-700' },
  { value: 'harvesting', label: 'Harvesting', icon: Scissors, color: 'bg-amber-100 text-amber-700' },
  { value: 'other', label: 'Other', icon: CalIcon, color: 'bg-gray-100 text-gray-700' }
];

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700'
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CropCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [showAlerts, setShowAlerts] = useState(false);
  const [form, setForm] = useState({
    crop_name: '', event_type: 'planting', event_date: '', end_date: '', notes: '', priority: 'medium', farm_id: ''
  });
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['calendar-events', selectedFarm, selectedMonth, selectedYear],
    queryFn: () => calendar.getAll({ farm_id: selectedFarm || undefined, month: selectedMonth, year: selectedYear }).then(r => r.data)
  });

  const { data: farmList } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farms.getAll().then(r => r.data)
  });

  const { data: alerts } = useQuery({
    queryKey: ['weather-alerts'],
    queryFn: () => calendar.getAlerts().then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => calendar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowForm(false);
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

  const generateAlertsMutation = useMutation({
    mutationFn: (farmId: string) => calendar.generateAlerts(farmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weather-alerts'] });
      setShowAlerts(true);
    }
  });

  const unreadAlerts = (alerts || []).filter((a: any) => !a.is_read);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, farm_id: form.farm_id || selectedFarm || undefined });
  };

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  const getEventsForDay = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return (events || []).filter((e: any) => e.event_date === dateStr);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Crop Calendar</h1>
          <p className="text-gray-500 mt-1">Plan and track all farming activities</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAlerts(!showAlerts)}
            className="relative flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">
            <AlertTriangle className="w-4 h-4" /> Weather Alerts
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadAlerts.length}</span>
            )}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {showAlerts && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Weather Alerts
            </h2>
            <button onClick={() => setShowAlerts(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          {!alerts || alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No weather alerts</p>
              <button onClick={() => farmList?.[0] && generateAlertsMutation.mutate(farmList[0].id)}
                className="mt-3 text-sm text-primary hover:underline">Check weather for your farm</button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${alert.is_read ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' : alert.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-500">{alert.alert_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {!alert.is_read && (
                      <button onClick={() => calendar.markAlertRead(alert.id).then(() => queryClient.invalidateQueries({ queryKey: ['weather-alerts'] }))}
                        className="text-xs text-primary hover:underline">Mark read</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Add Calendar Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                <select value={form.farm_id} onChange={e => setForm({ ...form, farm_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Select farm (optional)</option>
                  {farmList?.map((f: any) => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
                </select>
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
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
              <button type="submit" disabled={createMutation.isPending}
                className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {createMutation.isPending ? 'Adding...' : 'Add Event'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </form>
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
                <div key={day} className={`min-h-[60px] p-1 border rounded text-xs ${isToday ? 'border-primary bg-green-50' : 'border-gray-100'}`}>
                  <span className={`font-medium ${isToday ? 'text-primary' : 'text-gray-700'}`}>{day}</span>
                  {dayEvents.slice(0, 2).map((ev: any) => {
                    const typeInfo = EVENT_TYPES.find(t => t.value === ev.event_type) || EVENT_TYPES[5];
                    return (
                      <div key={ev.id} className={`mt-0.5 px-1 py-0.5 rounded text-[10px] truncate ${typeInfo.color}`}>
                        {ev.crop_name}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && <div className="text-[10px] text-gray-400">+{dayEvents.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {(events || []).filter((e: any) => e.status === 'pending').slice(0, 8).map((event: any) => {
              const typeInfo = EVENT_TYPES.find(t => t.value === event.event_type) || EVENT_TYPES[5];
              const Icon = typeInfo.icon;
              return (
                <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.crop_name}</p>
                        <p className="text-xs text-gray-500">{typeInfo.label} · {event.event_date}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => completeMutation.mutate(event.id)} title="Mark complete"
                        className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(event.id)} title="Delete"
                        className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {event.weather_alert && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="w-3 h-3" /> {event.alert_message || 'Weather alert active'}
                    </div>
                  )}
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
    </div>
  );
}
