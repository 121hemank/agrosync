import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Check, X, Clock } from 'lucide-react';
import { orders } from '../../services/api';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-600'
};

export default function BuyerOrders() {
  const queryClient = useQueryClient();

  const { data: myOrders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orders.getMyOrders().then(r => r.data)
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orders.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-orders'] })
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => orders.complete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-orders'] })
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">My Orders</h1>
        <p className="text-gray-500 mt-1">Track and manage your purchases</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p>Loading orders...</p>
        </div>
      ) : !myOrders || myOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm mt-1">Browse the marketplace to place your first order</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order: any) => (
            <div key={order.id} className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{order.users?.name || 'Farmer'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Order #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${statusStyles[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
              </div>

              {order.order_items && (
                <div className="mt-4 space-y-2">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm px-3 py-2 bg-gray-50 rounded-lg">
                      <span>{item.marketplace_products?.title || 'Product'} × {item.quantity}</span>
                      <span className="font-medium">₹{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <p className="font-bold text-lg">Total: ₹{order.total.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  {order.status === 'pending' && (
                    <button onClick={() => cancelMutation.mutate(order.id)} disabled={cancelMutation.isPending}
                      className="flex items-center gap-1 text-sm bg-gray-600 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  )}
                  {order.status === 'accepted' && (
                    <button onClick={() => completeMutation.mutate(order.id)} disabled={completeMutation.isPending}
                      className="flex items-center gap-1 text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
                      <Check className="w-4 h-4" /> Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
