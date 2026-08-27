import { useQuery } from '@tanstack/react-query';
import { BarChart3, DollarSign, TrendingUp } from 'lucide-react';
import { admin } from '../../services/api';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold font-heading">{value}</p>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => admin.analytics().then(r => r.data)
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading analytics...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500 mt-1">Platform revenue and analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${(data?.totalRevenue || 0).toLocaleString()}`} color="bg-green-500" />
        <StatCard icon={TrendingUp} label="Total Orders" value={data?.totalOrders || 0} color="bg-blue-500" />
        <StatCard icon={BarChart3} label="Avg Order Value" value={`₹${(data?.avgOrderValue || 0).toLocaleString()}`} color="bg-purple-500" />
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <h2 className="font-heading font-semibold text-lg mb-4">Monthly Revenue Breakdown</h2>
        {data?.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Month</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyRevenue.map((m: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-3 text-sm text-gray-700">{m.month}</td>
                    <td className="p-3 text-sm text-right font-medium">₹{m.amount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No revenue data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
