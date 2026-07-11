import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Check, X, ShieldOff } from 'lucide-react';
import { admin } from '../../services/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700'
};

const roleColors: Record<string, string> = {
  farmer: 'bg-green-100 text-green-700',
  buyer: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700'
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => admin.users().then(r => r.data)
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      admin.updateUserStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading users...</div>;

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">User Management</h1>
        <p className="text-gray-500 mt-1">Manage all platform users.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Joined</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{u.email}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${roleColors[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[u.status]}`}>{u.status}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {u.status === 'pending' && (
                        <button
                          onClick={() => mutation.mutate({ id: u.id, status: 'active' })}
                          className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {u.status !== 'suspended' ? (
                        <button
                          onClick={() => mutation.mutate({ id: u.id, status: 'suspended' })}
                          className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => mutation.mutate({ id: u.id, status: 'active' })}
                          className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {u.status === 'pending' && (
                        <button
                          onClick={() => mutation.mutate({ id: u.id, status: 'suspended' })}
                          className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
