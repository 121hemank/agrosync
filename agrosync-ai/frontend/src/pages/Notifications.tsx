import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { notifications } from '../services/api';

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: list, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notifications.getAll().then(r => r.data)
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notifications.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllRead = useMutation({
    mutationFn: () => notifications.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Notifications</h1>
          <p className="text-gray-500 mt-1">Stay updated with the latest activity</p>
        </div>
        <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {markAllRead.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !list || list.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-3 p-4 rounded-lg border ${n.is_read ? 'border-gray-100' : 'border-primary/20 bg-primary/5'}`}>
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                    <p className="font-medium text-sm">{n.title}</p>
                  </div>
                  {n.message && <p className="text-sm text-gray-500 mt-1">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    {n.type && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">{n.type}</span>}
                  </p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead.mutate(n.id)} disabled={markRead.isPending}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary shrink-0">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
