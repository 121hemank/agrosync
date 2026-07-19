import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, BarChart3, CalendarDays, Filter } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { analytics, farms } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function Revenue() {
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedFarm, setSelectedFarm] = useState('');
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');

  const { data: farmList } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farms.getAll().then(r => r.data)
  });

  const { data: revenueData } = useQuery({
    queryKey: ['analytics-revenue', selectedYear, selectedFarm],
    queryFn: () => analytics.revenue(selectedYear, selectedFarm || undefined).then(r => r.data)
  });

  const { data: dashboard } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analytics.dashboard().then(r => r.data)
  });

  const monthlyChartData = revenueData?.monthly ? {
    labels: revenueData.monthly.map((m: any) => m.name),
    datasets: [{
      label: 'Revenue',
      data: revenueData.monthly.map((m: any) => m.revenue),
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 2,
      borderRadius: 6
    }]
  } : null;

  const dailyChartData = revenueData?.daily ? {
    labels: revenueData.daily.slice(-30).map((d: any) => {
      const parts = d.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [{
      label: 'Revenue',
      data: revenueData.daily.slice(-30).map((d: any) => d.revenue),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx: any) => `₹${ctx.raw.toLocaleString()}` }
      }
    },
    scales: {
      y: { ticks: { callback: (v: any) => `₹${v.toLocaleString()}` } }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Revenue Tracking</h1>
          <p className="text-gray-500 mt-1">Track your earnings and financial performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold font-heading">₹{(revenueData?.total || dashboard?.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed Orders</p>
            <p className="text-xl font-bold font-heading">{revenueData?.ordersCount || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-xl font-bold font-heading">{dashboard?.totalOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center">
            <Filter className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Listings</p>
            <p className="text-xl font-bold font-heading">{dashboard?.activeListings || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Revenue Overview
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('monthly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'monthly' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <BarChart3 className="w-4 h-4" /> Monthly
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'daily' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <CalendarDays className="w-4 h-4" /> Daily
              </button>
            </div>
            <select
              value={selectedFarm}
              onChange={e => setSelectedFarm(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">All Farms</option>
              {farmList?.map((f: any) => (
                <option key={f.id} value={f.id}>{f.farm_name}</option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'monthly' ? (
          monthlyChartData ? (
            <div className="h-72">
              <Bar data={monthlyChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No revenue data available yet</p>
            </div>
          )
        ) : (
          dailyChartData && revenueData?.daily?.length > 0 ? (
            <div className="h-72">
              <Line data={dailyChartData} options={chartOptions} />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No revenue data available yet</p>
            </div>
          )
        )}
      </div>

      {viewMode === 'daily' && revenueData?.daily?.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Daily Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.daily.slice(-60).reverse().map((d: any) => (
                  <tr key={d.date} className="border-b last:border-0">
                    <td className="py-2 text-gray-600">{d.date}</td>
                    <td className="py-2 text-right font-medium">₹{d.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'monthly' && revenueData?.monthly && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 mt-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Monthly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.monthly.filter((m: any) => m.revenue > 0).map((m: any) => (
                  <tr key={m.month} className="border-b last:border-0">
                    <td className="py-2 text-gray-600">{m.name}</td>
                    <td className="py-2 text-right font-medium">₹{m.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
