import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { analytics } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Revenue() {
  const { data: dashboard } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analytics.dashboard().then(r => r.data)
  });

  const { data: revenueData } = useQuery({
    queryKey: ['analytics-revenue'],
    queryFn: () => analytics.revenue().then(r => r.data)
  });

  const chartData = {
    labels: revenueData?.monthly?.map((m: any) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[m.month - 1] || `Month ${m.month}`;
    }) || [],
    datasets: [{
      label: 'Revenue',
      data: revenueData?.monthly?.map((m: any) => m.revenue) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 2,
      borderRadius: 6
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => `₹${ctx.raw.toLocaleString()}` } } },
    scales: { y: { ticks: { callback: (v: any) => `₹${v.toLocaleString()}` } } }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Revenue Tracking</h1>
        <p className="text-gray-500 mt-1">Track your earnings and financial performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-xl font-bold font-heading">₹{(dashboard?.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-xl font-bold font-heading">{dashboard?.totalOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Listings</p>
            <p className="text-xl font-bold font-heading">{dashboard?.activeListings || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Monthly Revenue
        </h2>
        {revenueData?.monthly && revenueData.monthly.length > 0 ? (
          <div className="h-72">
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No revenue data available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
