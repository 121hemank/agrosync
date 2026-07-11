import { useQuery } from '@tanstack/react-query';
import { BarChart3, Sprout, TrendingUp, DollarSign, Package, Star } from 'lucide-react';
import { analytics } from '../../services/api';

export default function Analytics() {
  const { data: dashboard } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analytics.dashboard().then(r => r.data)
  });

  const { data: crops } = useQuery({
    queryKey: ['analytics-crops'],
    queryFn: () => analytics.crops().then(r => r.data)
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analytics.marketTrends().then(r => r.data)
  });

  const statCards = [
    { icon: Sprout, label: 'Total Farms', value: dashboard?.totalFarms || 0, color: 'bg-green-500' },
    { icon: Package, label: 'Active Listings', value: dashboard?.activeListings || 0, color: 'bg-blue-500' },
    { icon: TrendingUp, label: 'Total Orders', value: dashboard?.totalOrders || 0, color: 'bg-purple-500' },
    { icon: DollarSign, label: 'Total Revenue', value: `₹${(dashboard?.totalRevenue || 0).toLocaleString()}`, color: 'bg-amber-500' },
    { icon: Star, label: 'Avg Rating', value: dashboard?.averageRating?.toFixed(1) || '0.0', color: 'bg-pink-500' },
    { icon: Sprout, label: 'Crops Growing', value: dashboard?.cropsGrowing || 0, color: 'bg-teal-500' }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500 mt-1">Comprehensive farm analytics and market insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-xl font-bold font-heading">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" /> Crop Analytics
          </h2>
          {!crops || crops.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No crop data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Crop</th>
                    <th className="pb-3 font-medium">Planted</th>
                    <th className="pb-3 font-medium">Harvested</th>
                    <th className="pb-3 font-medium">Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {crops.map((crop: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 font-medium">{crop.crop_name}</td>
                      <td className="py-3">{crop.planted || 0}</td>
                      <td className="py-3 text-green-600">{crop.harvested || 0}</td>
                      <td className="py-3 text-red-600">{crop.failed || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Market Trends
          </h2>
          {!trends || trends.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No market trend data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Avg Price</th>
                    <th className="pb-3 font-medium">Demand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trends.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 font-medium">{item.product_name || item.name}</td>
                      <td className="py-3">₹{item.avg_price?.toLocaleString() || '0'}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.demand === 'High' ? 'bg-green-100 text-green-700' :
                          item.demand === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{item.demand || 'N/A'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
