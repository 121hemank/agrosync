import { useQuery } from '@tanstack/react-query';
import { Sprout, Package, TrendingUp, DollarSign, Calendar, CloudSun, ShoppingBag, BarChart3, Wallet, TrendingDown } from 'lucide-react';
import { analytics, weather } from '../../services/api';

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

export default function FarmerDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['farmer-dashboard'],
    queryFn: () => analytics.dashboard().then(r => r.data)
  });

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => import('../../services/api').then(m => m.farms.getAll().then(r => r.data))
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Farmer Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's your farm overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Sprout} label="Farms" value={stats?.totalFarms || 0} color="bg-green-500" />
        <StatCard icon={Package} label="Active Listings" value={stats?.activeListings || 0} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Total Orders" value={stats?.totalOrders || 0} color="bg-purple-500" />
        <StatCard icon={DollarSign} label="Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Your Farms</h2>
          {!farms || farms.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Sprout className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No farms registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {farms.slice(0, 4).map((farm: any) => (
                <div key={farm.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{farm.farm_name}</p>
                    <p className="text-sm text-gray-500">{farm.location || 'Location not set'} · {farm.area || 0} {farm.area_unit || 'hectares'}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{farm.soil_type || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Sprout, label: 'Add Farm', color: 'bg-green-500', path: '/farmer/farms' },
              { icon: CloudSun, label: 'Check Weather', color: 'bg-blue-500', path: '/farmer/weather' },
              { icon: Calendar, label: 'Crop Calendar', color: 'bg-indigo-500', path: '/farmer/calendar' },
              { icon: Wallet, label: 'Track Expenses', color: 'bg-red-500', path: '/farmer/expenses' },
              { icon: TrendingDown, label: 'Market Prices', color: 'bg-amber-500', path: '/farmer/prices' },
              { icon: ShoppingBag, label: 'Marketplace', color: 'bg-purple-500', path: '/farmer/marketplace' }
            ].map((item, i) => (
              <a key={i} href={item.path}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
