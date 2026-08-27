import { useQuery } from '@tanstack/react-query';
import { Package, Users } from 'lucide-react';
import { admin } from '../../services/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700'
};

export default function AdminOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => admin.orders().then(r => r.data)
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading orders...</div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No orders found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Orders Overview</h1>
        <p className="text-gray-500 mt-1">All platform orders.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Order ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Buyer</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Farmer</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Total</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-sm font-mono text-gray-700">{o.id.slice(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{o.buyer?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{o.farmer?.name || 'N/A'}</td>
                  <td className="p-4 text-sm font-medium">₹{o.total?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
