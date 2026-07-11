import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, DollarSign } from 'lucide-react';
import { analytics, orders } from '../../services/api';

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

export default function BuyerDashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['buyer-stats'],
    queryFn: () => analytics.buyer().then(r => r.data)
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orders.getMyOrders().then(r => r.data)
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Buyer Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Browse and manage your orders.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={LayoutDashboard} label="Total Orders" value={stats?.totalOrders || 0} color="bg-purple-500" />
        <StatCard icon={Package} label="Completed Orders" value={stats?.completedOrders || 0} color="bg-blue-500" />
        <StatCard icon={DollarSign} label="Total Spent" value={`₹${(stats?.totalSpent || 0).toLocaleString()}`} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Recent Orders</h2>
          {!recentOrders || recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{order.users?.name || 'Farmer'}</p>
                    <p className="text-sm text-gray-500">₹{order.total.toLocaleString()} · {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    order.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    order.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{order.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <h2 className="font-heading font-semibold text-lg mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/buyer/marketplace')}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Marketplace</span>
            </button>
            <button onClick={() => navigate('/buyer/orders')}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">My Orders</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
