import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Package } from 'lucide-react';
import { admin } from '../../services/api';

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  out_of_stock: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-700'
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => admin.products().then(r => r.data)
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => admin.updateUserStatus(id, 'archived'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading products...</div>;

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Product Management</h1>
        <p className="text-gray-500 mt-1">All marketplace products.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Farmer</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Price</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Quantity</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-medium">{p.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{p.farmer?.name || p.users?.name || 'N/A'}</td>
                  <td className="p-4 text-sm font-medium">₹{p.price?.toLocaleString()}</td>
                  <td className="p-4 text-sm text-gray-600">{p.quantity} {p.unit || ''}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[p.status] || 'bg-gray-100 text-gray-700'}`}>{p.status?.replace('_', ' ')}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    {p.status !== 'archived' && (
                      <button
                        onClick={() => archiveMutation.mutate(p.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
