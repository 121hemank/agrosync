import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, ArcElement } from 'chart.js';
import { DollarSign, Plus, TrendingUp, TrendingDown, Trash2, Edit2, X, Wallet, PieChart, AlertCircle } from 'lucide-react';
import { expenses as expensesAPI, farms } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, ArcElement);

const CATEGORIES = [
  { value: 'seeds', label: 'Seeds', color: '#22c55e' },
  { value: 'fertilizer', label: 'Fertilizer', color: '#3b82f6' },
  { value: 'pesticide', label: 'Pesticide', color: '#ef4444' },
  { value: 'labor', label: 'Labor', color: '#f59e0b' },
  { value: 'irrigation', label: 'Irrigation', color: '#06b6d4' },
  { value: 'equipment', label: 'Equipment', color: '#8b5cf6' },
  { value: 'transport', label: 'Transport', color: '#ec4899' },
  { value: 'other', label: 'Other', color: '#6b7280' }
];

const CATEGORY_COLORS: Record<string, string> = {
  seeds: 'bg-green-100 text-green-700',
  fertilizer: 'bg-blue-100 text-blue-700',
  pesticide: 'bg-red-100 text-red-700',
  labor: 'bg-yellow-100 text-yellow-700',
  irrigation: 'bg-cyan-100 text-cyan-700',
  equipment: 'bg-purple-100 text-purple-700',
  transport: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700'
};

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [selectedYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({
    farm_id: '', expense_category: 'seeds', description: '', amount: '', expense_date: '', crop_id: '', quantity: '', unit: ''
  });
  const queryClient = useQueryClient();

  const { data: expenseList } = useQuery({
    queryKey: ['expenses', selectedFarm],
    queryFn: () => expensesAPI.getAll({ farm_id: selectedFarm || undefined }).then(r => r.data)
  });

  const { data: farmList } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farms.getAll().then(r => r.data)
  });

  const { data: categorySummary } = useQuery({
    queryKey: ['expense-summary', selectedFarm, selectedYear],
    queryFn: () => expensesAPI.categorySummary({ farm_id: selectedFarm || undefined, year: selectedYear }).then(r => r.data)
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['expense-monthly', selectedFarm, selectedYear],
    queryFn: () => expensesAPI.monthlySummary({ farm_id: selectedFarm || undefined, year: selectedYear }).then(r => r.data)
  });

  const { data: profitability } = useQuery({
    queryKey: ['profitability', selectedFarm, selectedYear],
    queryFn: () => expensesAPI.profitability({ farm_id: selectedFarm || undefined, year: selectedYear }).then(r => r.data)
  });

  const [submitError, setSubmitError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => expensesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-monthly'] });
      queryClient.invalidateQueries({ queryKey: ['profitability'] });
      setShowForm(false);
      setSubmitError('');
      setForm({ farm_id: '', expense_category: 'seeds', description: '', amount: '', expense_date: '', crop_id: '', quantity: '', unit: '' });
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.error || err.message || 'Failed to add expense');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-monthly'] });
      queryClient.invalidateQueries({ queryKey: ['profitability'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    createMutation.mutate({
      ...form,
      amount: parseFloat(form.amount) || 0,
      quantity: form.quantity ? parseFloat(form.quantity) : undefined,
      crop_id: form.crop_id || undefined,
      farm_id: form.farm_id || selectedFarm || undefined
    });
  };

  const monthlyChartData = monthlyData ? {
    labels: monthlyData.map((m: any) => m.name),
    datasets: [{
      label: 'Expenses (₹)',
      data: monthlyData.map((m: any) => m.total),
      backgroundColor: 'rgba(239, 68, 68, 0.7)',
      borderColor: '#ef4444',
      borderWidth: 1,
      borderRadius: 6
    }]
  } : null;

  const profitChartData = profitability?.months ? {
    labels: profitability.months.map((m: any) => m.name),
    datasets: [
      {
        label: 'Revenue',
        data: profitability.months.map((m: any) => m.revenue),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Expenses',
        data: profitability.months.map((m: any) => m.expenses),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Profit',
        data: profitability.months.map((m: any) => m.profit),
        borderColor: '#3b82f6',
        borderDash: [5, 5],
        tension: 0.3
      }
    ]
  } : null;

  const categoryChartData = categorySummary?.categories ? {
    labels: Object.keys(categorySummary.categories),
    datasets: [{
      data: Object.values(categorySummary.categories).map((c: any) => c.total),
      backgroundColor: Object.keys(categorySummary.categories).map(cat => {
        const found = CATEGORIES.find(c => c.value === cat);
        return found ? found.color : '#6b7280';
      }),
      borderWidth: 2
    }]
  } : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Expense Tracker</h1>
          <p className="text-gray-500 mt-1">Track expenses and analyze profitability</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Expenses</p>
              <p className="text-xl font-bold">₹{(categorySummary?.totalExpenses || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-xl font-bold">₹{(profitability?.summary?.totalRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(profitability?.summary?.netProfit || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`w-5 h-5 ${(profitability?.summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className={`text-xl font-bold ${(profitability?.summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{(profitability?.summary?.netProfit || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><PieChart className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Profit Margin</p>
              <p className="text-xl font-bold">{profitability?.summary?.profitMargin || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Add Expense</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" /> {submitError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                <select value={form.farm_id} onChange={e => setForm({ ...form, farm_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Select farm</option>
                  {farmList?.map((f: any) => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.expense_category} onChange={e => setForm({ ...form, expense_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required
                  placeholder="e.g. Urea fertilizer for wheat field" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input type="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="kg, bag"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createMutation.isPending}
                className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {createMutation.isPending ? 'Adding...' : 'Add Expense'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Monthly Expenses</h2>
          {monthlyChartData ? (
            <Bar data={monthlyChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No data yet</div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Revenue vs Expenses</h2>
          {profitChartData ? (
            <Line data={profitChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">By Category</h2>
          {categoryChartData ? (
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No data yet</div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Recent Expenses</h2>
            <select value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
              <option value="">All Farms</option>
              {farmList?.map((f: any) => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(expenseList || []).slice(0, 10).map((exp: any) => (
                  <tr key={exp.id} className="border-b last:border-0">
                    <td className="py-3 text-gray-600">{exp.expense_date}</td>
                    <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[exp.expense_category] || 'bg-gray-100 text-gray-700'}`}>{CATEGORIES.find(c => c.value === exp.expense_category)?.label || exp.expense_category}</span></td>
                    <td className="py-3">{exp.description}</td>
                    <td className="py-3 text-right font-medium">₹{parseFloat(exp.amount).toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => deleteMutation.mutate(exp.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!expenseList || expenseList.length === 0) && (
              <div className="text-center py-8 text-gray-400">No expenses recorded yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


