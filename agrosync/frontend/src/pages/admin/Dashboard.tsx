import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Users, Sprout, ShoppingBag, Package, Clock, ArrowRight } from 'lucide-react';
import { admin } from '../../services/api';
import { useNavigate } from 'react-router-dom';

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => admin.dashboard().then(r => r.data)
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading dashboard...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of the platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={data?.totalUsers || 0} color="bg-blue-500" />
        <StatCard icon={Sprout} label="Farmers" value={data?.totalFarmers || 0} color="bg-green-500" />
        <StatCard icon={ShoppingBag} label="Buyers" value={data?.totalBuyers || 0} color="bg-purple-500" />
        <StatCard icon={Package} label="Total Products" value={data?.totalProducts || 0} color="bg-amber-500" />
        <StatCard icon={ShieldCheck} label="Total Orders" value={data?.totalOrders || 0} color="bg-indigo-500" />
        <StatCard icon={Clock} label="Pending Farmers" value={data?.pendingFarmers || 0} color="bg-rose-500" />
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200">
        <h2 className="font-heading font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate('/admin/users')}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-gray-700">Manage Users</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => navigate('/admin/products')}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-gray-700">Manage Products</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => navigate('/admin/orders')}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-gray-700">Manage Orders</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
